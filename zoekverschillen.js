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
    const gumgrootteInput = document.getElementById('gumgrootte');
    const gumgrootteWaarde = document.getElementById('gumgrootte-waarde');
    const gumSettingsDiv = document.getElementById('gum-settings');
    const lineThicknessSetting = document.getElementById('line-thickness-setting');
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
            lineThicknessSetting.style.display = (currentTool === 'gum') ? 'none' : 'flex';
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
        ['ruimte','Ruimte',['ruimtestation','maanverkenning']],
        ['de-zee','De zee',['onderwaterwereld','aan-de-kust']], ['sport','Sport',['sportdag','sporthal']]
    ];
    const toolInfo = {
        potlood:{name:'Potlood',text:'Teken vrij op de rechterafbeelding.'}, gum:{name:'Gum',text:'Kies een kleine of grote gom. De omtrek op de afbeelding toont precies wat wordt weggeveegd.'},
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

    const automaticThemes = new Set(['naar-school','herfst','sinterklaas','kerst','pasen','lente','carnaval','winter','zomer','valentijn','dieren','ruimte','de-zee']);
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
        'pakjesavond':['Sinterklaas knipoogt.','In de krul van de staf staat een ster.','De kaars op de schouw is verdwenen.','De maan aan het raam is een zon geworden.','De wortel is uit de schoen verdwenen.','De teddybeer draagt een strik.','Het ronde pakje heeft minder stippen.','Op de laars staat een hartje.','De zak heeft nog maar één kwastje.','Op een vlaggetje staat een extra kruis.'],
        'stoomboot':['Eén venster van de vuurtoren is verdwenen.','De meeuw linksboven draagt een matrozenpet.','De schoorsteen heeft een extra streep.','De vlag links op het schip heeft een andere punt.','Een patrijspoort heeft geen binnenring meer.','Het anker mist een zijpunt.','Sinterklaas knipoogt.','Het pakje van de helper heeft minder lint.','De pompon op de muts is een ster geworden.','Op de rechtervlag staat een kruis.'],
        'kerstkamer':['In de piek staat een cirkel.','Een kerstbal heeft minder strepen.','De middelste kerstsok heeft minder stippen.','De kat knipoogt.','Op de strik van de krans staat een ster.','Het lichtje in de lantaarn is uit.','Een stip op het pakje is een hart geworden.','De ster op de rechter kerstsok is een cirkel geworden.','Aan het raam ontbreekt een sneeuwstip.','De kerstbloem heeft een bolletje minder.'],
        'wintermarkt':['De sneeuwpop heeft een knoop minder.','De sjaal van de hond heeft minder strepen.','Het peperkoekmannetje heeft extra knopen.','Op de kerstsok staat een ster.','In de lichtslinger ontbreekt een lampje.','De verkoper draagt een hartje op zijn muts.','Het pakje van het meisje heeft minder lint.','Het lichtje in de linker lantaarn is uit.','De strik op de krans heeft een ster.','De hoge hoed van de sneeuwpop heeft een extra streep.'],
        'paaseieren-zoeken':['Het konijn knipoogt.','Het midden van de haarstrik is een hart geworden.','Op het ei van de jongen staat een ster.','Het ei in de mand van het meisje heeft minder stippen.','Het middelste ei heeft stippen in plaats van strepen.','Op de gieter staat een hart.','Het ei linksonder heeft minder zigzaglijnen.','Het ei rechtsonder heeft extra cirkels.','De lage boomtak heeft minder bladeren.','Het kuiken rechts knipoogt.'],
        'paastuin':['Het grote konijn knipoogt.','Op het ei van het konijn staat een ster.','De opening van het vogelhuisje is een hart geworden.','Een ei in de kruiwagen heeft minder stippen.','Een stip op het ei in de mand is een hart geworden.','De vlinder linksboven heeft een extra vleugelstip.','Het kuiken links knipoogt.','Het kuiken rechts heeft een extra vleugelstreep.','De bloem linksonder heeft een andere kern.','Onder de wolk hangt een regendruppel.'],
        'lentetuin':['De jongen draagt een bril.','De stippen op de laarzen zijn strepen geworden.','Op de gieter staat een groot hart.','De opening van het vogelhuisje is een hart geworden.','De zon heeft een gezicht gekregen.','De vlinder links is verdwenen.','De bij is verdwenen.','Op het rechter zaadzakje staat een groot hart.','In de bloempot staat een tulp minder.','De rechter narcis is verdwenen.'],
        'boerderij-in-de-lente':['De boer knipoogt.','Een vlek van de koe is een hart geworden.','Het kalf knipoogt.','In het grote tractorwiel staat een ster.','In het bovenste schuurraam ontbreekt een lijn.','De vliegende vogel heeft een extra vleugelstreep.','Het linker lammetje draagt een strik.','Het springende lammetje draagt een bel.','Het middelste kuiken knipoogt.','De linker narcis heeft een hartvormige kern.'],
        'carnavalsstoet':['De schedel op de piratenhoed is een ster geworden.','De kroon van de prinses heeft hartvormige punten.','De hoge hoed heeft drie dikke strepen.','In de hoorn staat een grote ster.','Op de trommel staat een groot hart.','Het grote masker heeft een cirkel in de middelste veer.','Eén glas van het feestmasker is een ster geworden.','De maraca heeft stippen in plaats van strepen.','De bloemenketting van de vrouw is verdwenen.','In de linker ballon staat een groot hart.'],
        'verkleedfeest':['De schedel op de piratenhoed is een hart geworden.','Op het ruimtepak staat een grote ster.','De clown heeft een groot hart op zijn pak.','De feesthoed van de clown is verdwenen.','De dinosaurus heeft minder tanden.','Het midden van de kattenstrik is een hart geworden.','De trommel heeft cirkels in plaats van driehoeken.','De rechter maraca heeft stippen in plaats van zigzaglijnen.','De stervormige toverstaf is een hart geworden.','Op het cakeje staat een groot hart.'],
        'sneeuwpret':['De sneeuwpop heeft een ronde neus.','Op de buik van de sneeuwpop staat een groot hart.','De sjaal van het knielende kind heeft grote stippen.','Op de trui van het kind op de slee staat een hart.','De vogel in de lucht is verdwenen.','De muts van de sneeuwpop heeft dikke strepen.','De pompon van het knielende kind is een ster geworden.','De want van het kind op de slee heeft strepen.','Op de trui van het staande kind staat een ster.','De sjaal van de sneeuwpop heeft grote stippen.'],
        'winterdorp':['Boven op de kerktoren staat een grote ster.','Het ronde kerkraam is een hart geworden.','De vogel linksboven is verdwenen.','De linker straatlamp heeft dikke strepen.','Op de jas van het meisje staat een hart.','De pompon van het meisje is een ster geworden.','Op de trui van de jongen staat een ster.','De sneeuwpop heeft een ronde neus.','Op de buik van de sneeuwpop staat een groot hart.','De vogel bij de sneeuwpop is een cadeau geworden.'],
        'stranddag':['De bloem op de zonnehoed is een grote ster geworden.','Op het badpak van het meisje staat een hart.','Het shirt van de jongen heeft dikke strepen.','Een strik aan de vlieger is een hart geworden.','De kleine meeuw links is verdwenen.','Op het zeil van de boot staat een zon.','Eén glas van de zonnebril is hartvormig.','Op het shirt van de man staat een grote ster.','De strandbal heeft grote stippen.','De zeester is een speelgoedboot geworden.'],
        'kamperen':['Op het shirt van het meisje staat een hart.','De beker van het meisje heeft grote stippen.','Het haarelastiek van het meisje is een ster geworden.','Op het shirt van de jongen staat een ster.','De marshmallow is een groot hart geworden.','De rugzak bij de tent heeft dikke strepen.','Op de tent staat een grote maan.','Een appel op het bord is een peer geworden.','De lantaarn heeft grote stippen.','De eekhoorn is een konijn geworden.'],
        'vriendschapsfeest':['De bloem in het haar van het meisje is een ster geworden.','Het shirt van de jongen heeft dikke strepen.','Het hart op de eerste kaart is een ster geworden.','Een hart in de slinger is een cirkel geworden.','De hartballon is een sterballon geworden.','Het shirt van het tweede meisje heeft grote stippen.','Het hart op de tweede kaart is een bloem geworden.','Het halsbandhangertje van de hond is een ster geworden.','Het vierkante cadeau rechts heeft dikke strepen.','De kat is een konijn geworden.'],
        'hartjestuin':['Het hart op het shirt van het meisje is een ster geworden.','Het shirt van de jongen heeft grote stippen.','Het hart op de gieter van de jongen is een bloem geworden.','Het hart op de tuinpoort is een grote ster geworden.','De vliegende vogel linksboven is verdwenen.','De vlinder linksboven is een zon geworden.','De rugleuning van de bank heeft dikke strepen.','Het grote cadeau links is een picknickmand geworden.','Het hart op de losse gieter is een cirkel geworden.','Een hartbloem in de grote pot is een sterbloem geworden.'],
        'dierenpark':['De giraf heeft nog maar één hoorn.','De olifant heeft nog maar één slagtand.','De slurf van de olifant staat omhoog.','De aap in de boom is een papegaai geworden.','De staart van de leeuw is verdwenen.','De staart van de zebra is verdwenen.','De pinguïn heeft een vis in zijn bek.','De emmer met bladeren is een strandbal geworden.','De pet van het kind is een wintermuts geworden.','De schoudertas van de vrouw is een rugzak geworden.'],
        'boerderijdieren':['Naast de kip staat een extra eendje.','De koe heeft nog maar één hoorn.','De manen van het paard zijn veel korter.','Het varken heeft een rechte staart.','De haan heeft minder grote staartveren.','De boom achter de stal is verdwenen.','Het vierkante stalraam is rond geworden.','Naast het schaap staat een extra lammetje.','De kleine vogel is een konijn geworden.','De bovenste hooibaal is een houten ton geworden.'],
        'dieren-in-het-bos':['Het konijn heeft één slap oor.','De eekhoorn houdt twee eikels vast.','De uil knipoogt.','Het hert heeft minder vlekken.','De vos heeft een streep op zijn staart.','Een paddenstoel is verdwenen.','Er ligt een dennenappel bij de boomstam.','De boomstam heeft een extra knoest.','De egel draagt een appel.','Het boomhol heeft een andere vorm.'],
        'boswandeling':['De eekhoorn houdt twee eikels vast.','De kleinste paddenstoel is verdwenen.','De egel draagt een appel.','De pompon van de muts heeft een andere vorm.','In de mand liggen minder kastanjes.','De laars heeft een extra streep.','Een kastanjebolster is verdwenen.','De grote paddenstoel heeft minder stippen.','Er zit een vogel in de boom.','Een dwarrelend blad is een dennenappel geworden.']
    };
    const automaticDifferencePoints = {
        'klas-met-kinderen':[[.54,.22,.11],[.277,.16,.06],[.797,.235,.06],[.925,.282,.06],[.425,.675,.05],[.33,.47,.05],[.126,.90,.045],[.758,.92,.045],[.412,.525,.04],[.132,.188,.055]],
        'speelplaats':[[.203,.515,.055],[.785,.75,.05],[.886,.79,.05],[.506,.188,.045],[.69,.48,.07],[.596,.763,.055],[.073,.895,.04],[.328,.14,.035],[.50,.335,.04],[.804,.285,.04]],
        'pakjesavond':[[.46,.225,.04],[.586,.10,.045],[.075,.16,.055],[.835,.11,.05],[.088,.365,.05],[.075,.725,.045],[.92,.85,.06],[.242,.87,.045],[.043,.835,.04],[.185,.12,.04]],
        'stoomboot':[[.073,.215,.03],[.22,.095,.055],[.526,.18,.055],[.385,.25,.06],[.477,.595,.04],[.84,.62,.055],[.69,.255,.04],[.815,.46,.05],[.052,.55,.04],[.94,.28,.05]],
        'kerstkamer':[[.18,.075,.04],[.214,.25,.04],[.49,.52,.055],[.73,.67,.045],[.49,.235,.045],[.625,.30,.045],[.145,.86,.045],[.582,.505,.045],[.785,.18,.07],[.91,.78,.045]],
        'wintermarkt':[[.838,.783,.05],[.21,.84,.05],[.426,.39,.04],[.485,.36,.04],[.68,.13,.04],[.855,.36,.045],[.675,.76,.055],[.047,.88,.04],[.17,.575,.045],[.87,.61,.055]],
        'paaseieren-zoeken':[[.45,.54,.04],[.82,.27,.04],[.305,.61,.045],[.84,.60,.05],[.475,.78,.055],[.845,.79,.06],[.215,.88,.05],[.735,.89,.055],[.37,.18,.08],[.60,.75,.04]],
        'paastuin':[[.48,.36,.045],[.53,.55,.05],[.875,.26,.05],[.235,.42,.055],[.445,.80,.05],[.255,.13,.045],[.18,.75,.04],[.82,.79,.05],[.065,.80,.045],[.115,.17,.04]],
        'lentetuin':[[.43,.47,.055],[.69,.69,.065],[.63,.60,.065],[.895,.23,.055],[.475,.13,.065],[.275,.17,.07],[.33,.29,.055],[.465,.87,.065],[.23,.45,.075],[.91,.75,.075]],
        'boerderij-in-de-lente':[[.605,.40,.045],[.84,.51,.055],[.84,.70,.045],[.495,.43,.05],[.76,.18,.05],[.59,.10,.045],[.20,.60,.05],[.35,.67,.055],[.515,.79,.04],[.055,.81,.045]],
        'carnavalsstoet':[[.73,.55,.06],[.43,.31,.065],[.24,.42,.06],[.28,.67,.055],[.684,.516,.065],[.529,.166,.065],[.536,.617,.055],[.477,.645,.055],[.92,.59,.075],[.216,.11,.065]],
        'verkleedfeest':[[.13,.27,.07],[.36,.40,.065],[.61,.43,.07],[.61,.23,.085],[.22,.71,.075],[.40,.75,.055],[.55,.86,.075],[.88,.70,.065],[.76,.37,.07],[.96,.30,.055]],
        'sneeuwpret':[[.434,.477,.045],[.43,.706,.06],[.16,.70,.07],[.80,.78,.055],[.62,.10,.065],[.47,.41,.06],[.18,.53,.055],[.70,.64,.05],[.64,.45,.055],[.47,.57,.07]],
        'winterdorp':[[.275,.065,.06],[.285,.33,.055],[.16,.14,.055],[.06,.47,.06],[.315,.73,.055],[.31,.58,.055],[.55,.73,.055],[.82,.71,.045],[.80,.87,.055],[.68,.91,.07]],
        'stranddag':[[.305,.51,.06],[.33,.66,.05],[.15,.50,.07],[.105,.22,.06],[.325,.16,.065],[.455,.30,.055],[.645,.40,.045],[.825,.53,.055],[.715,.84,.075],[.58,.91,.06]],
        'kamperen':[[.32,.51,.05],[.33,.54,.05],[.245,.40,.05],[.745,.52,.05],[.61,.59,.055],[.55,.53,.05],[.39,.26,.06],[.275,.83,.06],[.39,.74,.06],[.89,.52,.06]],
        'vriendschapsfeest':[[.155,.375,.055],[.42,.50,.07],[.325,.49,.055],[.59,.14,.05],[.095,.18,.08],[.61,.52,.07],[.71,.48,.06],[.33,.78,.05],[.74,.87,.075],[.52,.78,.085]],
        'hartjestuin':[[.215,.54,.055],[.70,.52,.06],[.66,.64,.055],[.49,.27,.065],[.13,.10,.08],[.31,.08,.065],[.87,.35,.075],[.16,.84,.085],[.72,.89,.065],[.91,.70,.06]],
        'dierenpark':[[.54,.055,.045],[.34,.34,.045],[.37,.24,.07],[.78,.18,.08],[.82,.50,.055],[.57,.62,.045],[.20,.65,.05],[.37,.74,.06],[.71,.69,.06],[.83,.78,.075]],
        'boerderijdieren':[[.40,.73,.05],[.34,.31,.045],[.53,.20,.07],[.52,.51,.045],[.09,.66,.07],[.09,.12,.08],[.36,.16,.06],[.72,.72,.065],[.37,.87,.065],[.88,.40,.07]],
        'dieren-in-het-bos':[[.58,.73,.075],[.78,.62,.07],[.76,.15,.065],[.58,.42,.09],[.10,.52,.08],[.39,.59,.06],[.70,.91,.06],[.72,.865,.055],[.12,.82,.065],[.12,.20,.075]],
        'boswandeling':[[.14,.48,.065],[.16,.87,.06],[.84,.80,.065],[.30,.30,.06],[.75,.59,.08],[.70,.70,.055],[.50,.87,.06],[.87,.63,.065],[.53,.18,.06],[.40,.18,.055]]
    };

    Object.assign(automaticDifferenceDescriptions, {
      'onderwaterwereld':['Het bootje is een schatkist geworden.','De krab is een kreeft geworden.','De linker zeester is verdwenen.','De rechter zeester is verdwenen.','De waterstraal van de walvis is weg.','De linker dolfijn is verdwenen.','De schildpad is een rog geworden.','Het zeepaardje is een kwal geworden.','Het kleinste visje links is verdwenen.','De walvis knipoogt.'],
      'aan-de-kust':['De vuurtoren heeft een puntdak.','Het vuurtorenraam is rond.','De meeuw helemaal links is verdwenen.','De vlag van de zeilboot is verdwenen.','De vissersboot is een sleepboot geworden.','De rechtertoren van het zandkasteel is verdwenen.','De emmer is een strandbal geworden.','Het kind houdt een schep vast.','De krab is een schildpad geworden.','De zeester is verdwenen.'],
      'sportdag':['De turnbok is een evenwichtsbalk geworden.','De handstand is een koprol geworden.','Er staat een drinkfles minder.','De sporttas is een ballenmand geworden.','Een kegel is verdwenen.','Het voetbaldoel mist zijn net.','Een vlaggetje is verdwenen.','De basketbal is een volleybal geworden.','Het springtouw is een hoepel geworden.','Er loopt een kind minder.'],
      'sporthal':['De tafeltennistafel mist haar net.','Een batje is een balletje geworden.','Er is een hockeystick minder.','Het hockeydoel is vervangen door kegels.','De ballenmand is een sporttas geworden.','De volleybal is verdwenen.','Bij het volleybalnet staat een speler minder.','Een badmintonracket is veranderd.','De shuttle is verdwenen.','Op de bank staat een drinkfles minder.'],
      'drukke-straat':['Schoorsteen weg.','Boograam vierkant.','Boom weg.','Bus is dubbeldekker.','Bestelwagen is pick-up.','Tram mist koplamp.','Scooter heeft bezorgbak.','Auto is taxi.','Verkeerslicht heeft minder lampen.','Hond is kat.'],
      'bouwwerf':['Wolk weg.','Extra kraanbalk.','Kraanarm korter.','Vrachtwagen mist wiel.','Graafbak is boor.','Buis minder.','Kegel is gereedschapskist.','Kruiwagen mist wiel.','Betonmolen is watertank.','Extra arbeider.'],
      'prehistorisch-kamp':['Boom weg.','Tent gesloten.','Extra hert.','Vis minder.','Mand is pot.','Kampvuur uit.','Speer is bijl.','Bessenmand weg.','Extra werktuig.','Tent is afdak.'],
      'grotschilderingen':['Paard is mammoet.','Bizon kijkt andersom.','Extra hert.','Handafdruk veranderd.','Extra handafdruk.','Kom is mand.','Lampje uit.','Speer minder.','Huid is brandhout.','Grotopening erbij.'],
      'romeinse-markt':['Zuil weg.','Marktdoek recht.','Amfoor is schaal.','Fruitmand weg.','Extra paard.','Kar mist wiel.','Fontein uit.','Brood is vis.','Kruik weg.','Man draagt helm.'],
      'egyptische-nijl':['Piramide links weg.','Piramide rechts weg.','Extra zeilboot.','Palmboom weg.','Os weg.','Extra ibis.','Papyrusbloem weg.','Kruik weg.','Ploeg is hak.','Krokodil erbij.'],
      'kasteelleven':['Vlag weg.','Poort half gesloten.','Paard is ezel.','Kar mist wiel.','Smid gebruikt tang.','Vuur uit.','Kip is gans.','Brood minder.','Mand aan put.','Extra kruik.'],
      'middeleeuwse-markt':['Vlag weg.','Hond is kat.','Luit is trommel.','Fontein uit.','Kar mist wiel.','Broodmand is appelkist.','Luik weg.','Kruik is mand.','Extra ton.','Schoorsteen rond.'],
      'ontdekkingsreis':['Grote vlag veranderd.','Zeil opgerold.','Meeuw minder.','Verrekijker is kaart.','Stuurman draagt hoed.','Kompasroos weg.','Anker weg.','Zeilboot is roeiboot.','Ton minder.','Reddingsboei erbij.'],
      'drukkerij':['Raamlat weg.','Boeken minder.','Eén inktpot.','Ander zetwerktuig.','Lettervak leeg.','Inktrol is veerpen.','Man houdt boek.','Pershendel weg.','Bedrukte bladen.','Boek minder.'],
      'stoomtreinstation':['Wolk weg.','Klok zonder wijzers.','Treinbel weg.','Koplamp vierkant.','Treinwiel weg.','Koffer minder.','Jongen draagt rugzak.','Vrouw heeft paraplu.','Bank weg.','Kat erbij.'],
      'oude-fabriek':['Hanglamp weg.','Meterwijzer weg.','Spaak weg.','Sleutel is hamer.','Oliekan is gereedschapskist.','Schroevendraaier in hand.','Tandwiel weg.','Twee kisten op kar.','Kar mist wiel.','Losse kist weg.'],
      'moderne-stad':['Bloembak weg.','Bus is tram.','Verkeerslicht weg.','Balkon weg.','Schommel is wip.','Afvalbak minder.','Fietsmand erbij.','Bezorgdoos weg.','Hond erbij.','Speelraam vierkant.'],
      'duurzame-buurt':['Windmolenwiek weg.','Zonnepaneel weg.','Vogel weg.','Bus is vrachtwagen.','Laadkabel weg.','Afvalbak minder.','Regenton is compostbak.','Fietser minder.','Schep is hark.','Zonnebloem is boompje.'],
      'ruimtestation':['De grote ster bovenaan het raam is weg.','De aarde in het raam is een maan geworden.','De steeksleutel is weg.','De schroevendraaier is een tang geworden.','De opbergzak is weg.','Het meisje houdt een bloem vast.','De tablet is een boek geworden.','De robot met gieter is een vliegende drone geworden.','De middelste plant is weg.','Een rond knopje op het bedieningspaneel is weg.'],
      'maanverkenning':['De aarde is weg.','Een poot van de maanlander is weg.','De antenne is een vlag geworden.','De schotel is weg.','Eén wiel van de maanwagen is weg.','De arm van de astronaut staat omlaag.','De robot is een maanwagen geworden.','Er staat één stenenkist minder.','De vlag is driehoekig geworden.','Er is een grote krater bijgekomen.']
    });
    Object.assign(automaticDifferencePoints, {
      'onderwaterwereld':[[.30,.68,.14],[.68,.85,.09],[.20,.88,.08],[.82,.88,.08],[.37,.06,.07],[.68,.16,.10],[.66,.35,.12],[.78,.55,.09],[.13,.39,.08],[.40,.21,.06]],
      'aan-de-kust':[[.21,.08,.09],[.21,.22,.06],[.09,.18,.08],[.88,.27,.07],[.62,.42,.12],[.43,.72,.08],[.52,.76,.08],[.64,.77,.08],[.88,.84,.10],[.44,.88,.08]],
      'sportdag':[[.37,.75,.14],[.63,.70,.12],[.67,.87,.07],[.86,.87,.12],[.04,.43,.07],[.12,.25,.13],[.15,.10,.09],[.47,.24,.07],[.76,.25,.10],[.92,.35,.11]],
      'sporthal':[[.25,.61,.13],[.13,.58,.07],[.78,.73,.11],[.75,.62,.12],[.93,.66,.11],[.29,.10,.07],[.37,.22,.10],[.72,.18,.08],[.78,.20,.06],[.20,.82,.08]],
      'drukke-straat':[[.43,.055,.06],[.20,.22,.06],[.34,.31,.10],[.22,.44,.14],[.50,.47,.11],[.82,.49,.06],[.68,.50,.08],[.36,.65,.11],[.74,.38,.08],[.24,.83,.08]],'bouwwerf':[[.095,.13,.08],[.43,.29,.09],[.49,.12,.11],[.25,.53,.09],[.37,.69,.10],[.16,.90,.10],[.47,.88,.09],[.69,.87,.08],[.72,.60,.13],[.87,.35,.09]],
      'prehistorisch-kamp':[[.10,.15,.13],[.25,.38,.14],[.60,.31,.08],[.78,.51,.09],[.89,.68,.08],[.50,.78,.11],[.46,.65,.09],[.10,.84,.10],[.69,.92,.08],[.38,.34,.11]],'grotschilderingen':[[.52,.19,.12],[.78,.17,.12],[.42,.36,.09],[.73,.44,.08],[.90,.28,.08],[.31,.86,.08],[.55,.88,.07],[.12,.82,.09],[.87,.88,.11],[.93,.58,.09]],
      'romeinse-markt':[[.42,.20,.09],[.20,.16,.13],[.14,.53,.08],[.57,.41,.07],[.74,.31,.10],[.91,.36,.08],[.76,.55,.10],[.88,.62,.08],[.88,.89,.08],[.63,.29,.08]],'egyptische-nijl':[[.36,.24,.09],[.57,.24,.09],[.52,.30,.11],[.31,.28,.09],[.43,.50,.13],[.63,.52,.08],[.90,.33,.09],[.89,.88,.08],[.23,.58,.09],[.35,.43,.10]],
      'kasteelleven':[[.51,.09,.07],[.30,.40,.13],[.64,.44,.10],[.69,.49,.07],[.78,.41,.07],[.90,.45,.08],[.61,.69,.08],[.85,.78,.08],[.49,.64,.08],[.21,.55,.08]],'middeleeuwse-markt':[[.43,.09,.06],[.42,.84,.09],[.25,.59,.10],[.48,.53,.10],[.64,.52,.08],[.10,.73,.11],[.87,.15,.08],[.88,.55,.08],[.66,.86,.11],[.64,.17,.07]],
      'ontdekkingsreis':[[.37,.10,.08],[.36,.34,.14],[.13,.11,.08],[.72,.42,.10],[.56,.49,.08],[.36,.60,.10],[.61,.73,.08],[.90,.74,.10],[.23,.82,.10],[.09,.58,.09]],'drukkerij':[[.11,.20,.10],[.31,.14,.10],[.31,.27,.07],[.18,.59,.09],[.15,.67,.09],[.45,.60,.10],[.48,.30,.10],[.80,.33,.09],[.75,.45,.10],[.87,.86,.10]],
      'stoomtreinstation':[[.36,.09,.10],[.83,.35,.09],[.35,.34,.06],[.18,.33,.08],[.36,.51,.10],[.17,.75,.09],[.61,.68,.09],[.48,.70,.10],[.84,.84,.13],[.76,.85,.09]],'oude-fabriek':[[.38,.10,.10],[.44,.22,.06],[.38,.41,.10],[.08,.38,.08],[.07,.27,.09],[.18,.58,.09],[.27,.66,.07],[.72,.82,.12],[.67,.90,.08],[.90,.89,.10]],
      'moderne-stad':[[.07,.15,.09],[.43,.40,.15],[.26,.28,.08],[.55,.20,.08],[.91,.50,.11],[.54,.89,.09],[.22,.80,.08],[.90,.77,.10],[.64,.69,.09],[.81,.40,.07]],'duurzame-buurt':[[.41,.13,.10],[.25,.20,.10],[.70,.12,.08],[.43,.47,.15],[.16,.51,.07],[.81,.51,.10],[.93,.52,.11],[.81,.78,.12],[.19,.74,.09],[.06,.66,.10]],
      'ruimtestation':[[.58,.10,.07],[.51,.28,.16],[.27,.17,.08],[.76,.17,.08],[.11,.42,.09],[.30,.49,.09],[.48,.61,.10],[.64,.64,.12],[.44,.86,.10],[.956,.277,.045]],'maanverkenning':[[.22,.14,.14],[.86,.39,.10],[.79,.18,.08],[.37,.43,.08],[.49,.54,.08],[.20,.48,.10],[.40,.80,.11],[.57,.84,.10],[.90,.57,.10],[.12,.83,.11]]
    });

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
            case 'gum': {
                const size = Math.max(4, Math.min(40, Number(gumgrootteInput.value) || 12));
                const outer = size - 2;
                const shape = gumvormSelect.value === 'vierkant'
                    ? `%3Crect x='1' y='1' width='${outer}' height='${outer}' fill='none' stroke='white' stroke-width='3'/%3E%3Crect x='1' y='1' width='${outer}' height='${outer}' fill='none' stroke='%230b3b59' stroke-width='1.5'/%3E`
                    : `%3Ccircle cx='${size / 2}' cy='${size / 2}' r='${Math.max(1, size / 2 - 1)}' fill='none' stroke='white' stroke-width='3'/%3E%3Ccircle cx='${size / 2}' cy='${size / 2}' r='${Math.max(1, size / 2 - 1)}' fill='none' stroke='%230b3b59' stroke-width='1.5'/%3E`;
                return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 ${size} ${size}'%3E${shape}%3C/svg%3E") ${size / 2} ${size / 2}, crosshair`;
            }
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
        const size = parseFloat(gumgrootteInput.value);
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

    function updateGumPreview() {
        gumgrootteWaarde.value = gumgrootteInput.value;
        if (currentTool === 'gum') canvasVerschillen.style.cursor = getCursorForTool('gum');
    }
    gumgrootteInput.addEventListener('input', updateGumPreview);
    gumvormSelect.addEventListener('change', updateGumPreview);

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

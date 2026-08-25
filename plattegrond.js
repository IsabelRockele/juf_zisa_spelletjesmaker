document.addEventListener('DOMContentLoaded', () => {
    const canvasEl = document.getElementById('canvas');
    const canvas = new fabric.Canvas(canvasEl, {
        backgroundColor: '#fff',
        preserveObjectStacking: true
    });

    // === LEGENDE-NAAMMAPPING (bepaalt ook wat wel/niet in legende komt) ===
    const legendeNamen = {
        bureau: "Bureau juf",
        leerlingBureau: "Bureau",
        schoolbank: "Schoolbank",
        dubbeleSchoolbank: "Schoolbank voor 2 leerlingen",
        kast: "Kast",
        wastafel: "Wastafel",
        schoolbord: "Schoolbord",
        schoolbordFlappen: "Schoolbord",
        deur: "Deur",
        raam: "Raam",
        muur: "Muur",
        kring: "Kring",
        kringZitbank: "Zitbank voor kring",
        tafel: "Tafel"
    };

    // Los geplaatste zitbanken vormen samen één kring in de legende.
    const normaliseerLegendeType = type => type === 'kringZitbank' ? 'kring' : type;
    const kleurNaarRgba = kleur => {
        if (kleur === undefined || kleur === null || kleur === '') return null;
        try {
            const bron = new fabric.Color(String(kleur)).getSource();
            return Array.isArray(bron) && bron.length >= 3 ? bron : null;
        } catch (_) {
            return null;
        }
    };
    const kleurenZijnGelijk = (a, b) => {
        const kleurA = kleurNaarRgba(a);
        const kleurB = kleurNaarRgba(b);
        if (!kleurA || !kleurB) return String(a ?? '') === String(b ?? '');
        return kleurA.every((waarde, index) => waarde === kleurB[index]);
    };

    // --- HELPER: INTERACTIEVE OBJECTEN ---
    function maakInteractief(obj) {
        obj.set({
            selectable: true,
            hasControls: true,
            hasBorders: true,
            lockScalingFlip: true,
            lockUniScaling: false,
            cornerStyle: 'circle',
            transparentCorners: false,
            borderDashArray: null
        });
        return obj;
    }

    // --- PAD NAAR PNG-MEUBELS ---
    const IMG_PATH = window.location.pathname.includes('/ontdek/')
        ? '../plattegrond_afbeeldingen/'
        : 'plattegrond_afbeeldingen/';

    // --- HELPER: HTML-icoon (voor de legendeweergave op pagina) ---
    function maakIcoonElement(type) {
        const pngTypes = ['schoolbank','bureau','kast','wastafel', 'kring'];
        if (pngTypes.includes(type)) {
            const wrapper = document.createElement('span');
            wrapper.style.display = 'inline-flex';
            wrapper.style.justifyContent = 'center';
            wrapper.style.alignItems = 'center';
            wrapper.style.width = '30px';
            wrapper.style.height = '30px';
            wrapper.style.border = '1px solid #333';
            wrapper.style.margin = '0 8px';

            const img = document.createElement('img');
            img.src = `${IMG_PATH}${type}.png`;
            img.alt = type;
            img.style.maxWidth = '24px';
            img.style.maxHeight = '24px';
            wrapper.appendChild(img);
            return wrapper;
        }
        let svg = '';
        if (type === 'dubbeleSchoolbank') {
            svg = `<svg viewBox="0 0 120 65" xmlns="http://www.w3.org/2000/svg">
                     <rect x="2" y="25" width="116" height="36" rx="3" fill="#fff" stroke="#3f4a54" stroke-width="2"/>
                     <rect x="18" y="2" width="32" height="17" rx="3" fill="#fff" stroke="#3f4a54" stroke-width="2"/>
                     <rect x="70" y="2" width="32" height="17" rx="3" fill="#fff" stroke="#3f4a54" stroke-width="2"/>
                   </svg>`;
        } else if (type === 'leerlingBureau') {
            svg = `<svg viewBox="0 0 60 40" xmlns="http://www.w3.org/2000/svg">
                     <rect x="2" y="2" width="56" height="36" fill="none" stroke="#333" stroke-width="2"/>
                     <circle cx="45" cy="20" r="6" fill="none" stroke="#333" stroke-width="2"/>
                   </svg>`;
        } else if (type === 'tafel') {
            svg = `<svg viewBox="0 0 80 50" xmlns="http://www.w3.org/2000/svg">
                     <rect x="2" y="2" width="76" height="46" fill="none" stroke="#333" stroke-width="2"/>
                   </svg>`;
        } else if (type === 'schoolbord' || type === 'schoolbordFlappen') {
            svg = `<svg viewBox="0 0 120 30" xmlns="http://www.w3.org/2000/svg">
                     <rect x="10" y="10" width="100" height="10" fill="#e6e6e6" stroke="#000" stroke-width="2"/>
                     ${type === 'schoolbordFlappen'
                        ? `<rect x="-15" y="10" width="25" height="10" fill="#f2f2f2" stroke="#000" stroke-width="2"/>
                           <rect x="110" y="10" width="25" height="10" fill="#f2f2f2" stroke="#000" stroke-width="2"/>`
                        : '' }
                   </svg>`;
        } else if (type === 'muur') {
            svg = `<svg viewBox="0 0 120 20" xmlns="http://www.w3.org/2000/svg">
                     <line x1="5" y1="10" x2="115" y2="10" stroke="#333" stroke-width="5" />
                   </svg>`;
        } else if (type === 'deur') {
            svg = `<svg viewBox="0 0 50 45" xmlns="http://www.w3.org/2000/svg">
                     <line x1="5" y1="5" x2="5" y2="40" stroke="#000" stroke-width="2"/>
                     <path d="M5 5 Q45 5 45 40" fill="none" stroke="#000" stroke-width="2"/>
                   </svg>`;
        } else if (type === 'raam') {
            svg = `<svg viewBox="0 0 84 16" xmlns="http://www.w3.org/2000/svg">
                     <line x1="4" y1="5" x2="80" y2="5" stroke="#6cace4" stroke-width="2"/>
                     <line x1="4" y1="11" x2="80" y2="11" stroke="#6cace4" stroke-width="2"/>
                   </svg>`;
        } else {
            svg = `<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"></svg>`;
        }
        const wrapper = document.createElement('span');
        wrapper.style.display = 'inline-flex';
        wrapper.style.justifyContent = 'center';
        wrapper.style.alignItems = 'center';
        wrapper.style.width = '30px';
        wrapper.style.height = '30px';
        wrapper.style.border = '1px solid #333';
        wrapper.style.margin = '0 8px';
        wrapper.innerHTML = svg;
        return wrapper;
    }

    // --- VARIABELEN & STATUS ---
    let modus = 'bouw';
    let isWisselModusActief = false;
    let bouwTool = '';
    let isDrawingWall = false;
    let wallStartPoint;
    let gridVisible = false;
    let gridGroup = new fabric.Group([], { selectable: false, evented: false, excludeFromExport: true });
    let gridSize = 20;
    const metersPerGrid = 0.5;
    let metrischeModusActief = false;
    const meubelMaten = {
        schoolbank: [0.7, 0.5], dubbeleSchoolbank: [1.2, 0.5], bureau: [1.4, 0.7], kast: [1.0, 0.45],
        wastafel: [0.6, 0.5], kring: [3.0, 3.0], kringZitbank: [1.2, 0.4], leerlingBureau: [0.7, 0.5],
        tafel: [1.6, 0.8], schoolbord: [2.4, 0.15], schoolbordFlappen: [3.0, 0.15],
        deur: [0.9, 0.9], raam: [1.5, 0.1]
    };
    let actieveLegendeType = null;
    let actieveLegendeKleur = '#FFEB3B';
    let gebruikteLegendeItems = new Map();
    let history = [];
    let redoStack = [];
    let isUpdatingState = false;
    const customProperties = ['studentNaam', 'voorwerpType', 'isNaam', 'gekoppeldAan', 'echteBreedteM', 'echteDiepteM', 'metrischeSchaal', 'gridPixelSize', 'metersPerGrid', 'standaardVulling', 'nietInkleuren'];

    // --- STANDAARD STIJLEN (VOOR HERSTELLEN) ---
    const defaultStyles = {
        schoolbord: { fill: '#e6e6e6' },
        deur: { pathStroke: 'black' },
        schoolbordFlappen: [
            { fill: '#e6e6e6' },
            { fill: '#f2f2f2' },
            { fill: '#f2f2f2' }
        ]
    };

    // --- UI ELEMENTEN ---
    const formaatWisselKnop = document.getElementById('formaatWisselKnop');
    const undoKnop = document.getElementById('undoKnop');
    const redoKnop = document.getElementById('redoKnop');
    const verwijderKnop = document.getElementById('verwijderKnop');
    const dupliceerKnop = document.getElementById('dupliceerKnop');
    const spiegelKnop = document.getElementById('spiegelKnop');
    const draaiKwartslagKnop = document.getElementById('draaiKwartslagKnop');
    const zoomUitKnop = document.getElementById('zoomUitKnop');
    const zoomResetKnop = document.getElementById('zoomResetKnop');
    const zoomInKnop = document.getElementById('zoomInKnop');
    const grootTonenKnop = document.getElementById('grootTonenKnop');
    const nieuwKnop = document.getElementById('nieuwKnop');
    const exporteerJsonKnop = document.getElementById('exporteerJsonKnop');
    const importeerJsonKnop = document.getElementById('importeerJsonKnop');
    const jsonFileInput = document.getElementById('json-file-input');
    const legendeCategorieKnoppen = document.querySelectorAll('#legende-categorieen button');
    const modusKnoppen = {
        bouw: document.getElementById('bouwModusKnop'),
        meubel: document.getElementById('meubelModusKnop'),
        namen: document.getElementById('namenModusKnop'),
        legende: document.getElementById('legendeModusKnop'),
        wissel: document.getElementById('wisselModusKnop')
    };
    const werkbalken = {
        bouw: document.getElementById('bouw-werkbalk'),
        meubel: document.getElementById('meubel-werkbalk'),
        namen: document.getElementById('namen-werkbalk'),
    };
    const legendeContainer = document.getElementById('legende-container');
    const controlsSidebar = document.getElementById('controls-sidebar');
    if (controlsSidebar && legendeContainer) controlsSidebar.appendChild(legendeContainer);
    const vasteBewerkbalk = document.querySelector('.edit-section');
    const workspace = document.querySelector('.workspace');
    let weergaveZoom = 1;
    let zoomVoorPresentatie = 1;
    const werkbladZone = workspace?.querySelector('.pagina-container');
    if (workspace && werkbladZone && vasteBewerkbalk) workspace.insertBefore(vasteBewerkbalk, werkbladZone);
    const rasterToggle = document.getElementById('rasterToggle');
    const namenTonenToggle = document.getElementById('namenTonenToggle');
    const legendeTonenToggle = document.getElementById('legendeTonenToggle');
    const maatPaneel = document.getElementById('maatPaneel');
    const maatType = document.getElementById('maatType');
    const maatBreedte = document.getElementById('maatBreedte');
    const maatDiepte = document.getElementById('maatDiepte');
    const maatVast = document.getElementById('maatVast');
    const maatStandaardKnop = document.getElementById('maatStandaardKnop');
    const namenWachtlijstContainer = document.getElementById('namen-wachtlijst-container');
    const namenLijst = document.getElementById('namen-lijst');
    const kleurenpalet = document.getElementById('kleurenpalet');
    const modusUitleg = document.getElementById('modus-uitleg');
    const modusUitlegTeksten = {
        bouw: ['📐', 'Je bouwt nu het lokaal', 'Kies hieronder een volledige rechthoekige klas of teken muren, deuren en ramen afzonderlijk.'],
        meubel: ['🪑', 'Je plaatst nu meubels', 'Kies hieronder een meubel. Het verschijnt op het blad en kan daarna versleept, gedraaid of vergroot worden.'],
        namen: ['✏️', 'Je voegt nu namen toe', 'Selecteer eerst een meubel, typ een leerlingnaam en klik daarna op “Naam toevoegen aan selectie”.'],
        legende: ['🎨', 'Je maakt nu een kleurenlegende', 'Kies een categorie en een kleur. Klik vervolgens op de bijbehorende objecten in de plattegrond.'],
        wissel: ['🔄', 'Je wisselt nu leerlingplaatsen', 'Sleep namen uit de wachtlijst naar een andere vrije plaats en klik op “Klaar” wanneer iedereen zit.']
    };

    function updateModusUitleg(nieuweModus) {
        if (!modusUitleg || !modusUitlegTeksten[nieuweModus]) return;
        const [icoon, titel, uitleg] = modusUitlegTeksten[nieuweModus];
        modusUitleg.innerHTML = `<span>${icoon}</span><div><strong>${titel}</strong><small>${uitleg}</small></div>`;
    }

    function brengModusGereedschapInBeeld(nieuweModus) {
        if (!controlsSidebar) return;
        const doel = werkbalken[nieuweModus] || (nieuweModus === 'legende' ? legendeContainer : modusUitleg);
        if (!doel) return;
        requestAnimationFrame(() => {
            const zijbalkRechthoek = controlsSidebar.getBoundingClientRect();
            const doelRechthoek = doel.getBoundingClientRect();
            const gewensteBovenkant = controlsSidebar.scrollTop + doelRechthoek.top - zijbalkRechthoek.top - 8;
            controlsSidebar.scrollTo({ top: Math.max(0, gewensteBovenkant), behavior: 'smooth' });
            doel.classList.remove('context-attention');
            requestAnimationFrame(() => doel.classList.add('context-attention'));
        });
    }

    // Houd het volledige tekenblad zichtbaar zonder een scrollbar in de werkzone.
    let canvasResizeFrame = null;
    function pasCanvasInWerkruimte() {
        const werkruimte = document.querySelector('.workspace .pagina-container');
        const canvasHost = canvas.wrapperEl?.parentElement;
        const fabricWrapper = canvas.wrapperEl;
        if (!werkruimte || !canvasHost || !fabricWrapper) return;

        const zijpanelen = Array.from(werkruimte.children).filter(element =>
            element !== canvasHost && !element.classList.contains('verborgen')
        );
        const zijbreedte = zijpanelen.reduce((totaal, element) => totaal + element.offsetWidth + 18, 0);
        // getBoundingClientRect blijft gelijk wanneer een scrollbar verschijnt.
        // clientWidth/clientHeight wisselen dan wel en konden het canvas na een
        // JSON-import eindeloos laten groeien en krimpen.
        const werkruimteRect = werkruimte.getBoundingClientRect();
        const beschikbareBreedte = Math.max(260, Math.floor(werkruimteRect.width) - zijbreedte - 48);
        const beschikbareHoogte = Math.max(320, Math.floor(werkruimteRect.height) - 56);
        const basisBreedte = canvas.getWidth();
        const basisHoogte = canvas.getHeight();
        const passendeSchaal = Math.min(1, beschikbareBreedte / basisBreedte, beschikbareHoogte / basisHoogte);
        const schaal = Math.min(2.5, passendeSchaal * weergaveZoom);
        const zichtbareBreedte = Math.round(basisBreedte * schaal);
        const zichtbareHoogte = Math.round(basisHoogte * schaal);

        const breedteCss = `${zichtbareBreedte}px`;
        const hoogteCss = `${zichtbareHoogte}px`;
        fabricWrapper.style.width = breedteCss;
        fabricWrapper.style.height = hoogteCss;
        fabricWrapper.querySelectorAll('canvas').forEach(element => {
            element.style.width = breedteCss;
            element.style.height = hoogteCss;
        });
        canvasHost.style.width = `${zichtbareBreedte + 24}px`;
        canvasHost.style.height = `${zichtbareHoogte + 24}px`;
        workspace.classList.toggle('zoom-modus', weergaveZoom > 1.001);
        canvas.calcOffset();
    }

    function planCanvasAanpassing() {
        if (canvasResizeFrame !== null) return;
        canvasResizeFrame = requestAnimationFrame(() => {
            canvasResizeFrame = null;
            pasCanvasInWerkruimte();
        });
    }

    function stelWeergaveZoomIn(nieuweZoom) {
        weergaveZoom = Math.max(0.75, Math.min(2.5, nieuweZoom));
        zoomResetKnop.textContent = `${Math.round(weergaveZoom * 100)}%`;
        pasCanvasInWerkruimte();
    }

    zoomUitKnop.addEventListener('click', () => stelWeergaveZoomIn(weergaveZoom - 0.25));
    zoomInKnop.addEventListener('click', () => stelWeergaveZoomIn(weergaveZoom + 0.25));
    zoomResetKnop.addEventListener('click', () => stelWeergaveZoomIn(1));
    grootTonenKnop.addEventListener('click', () => {
        const wordtGroot = !workspace.classList.contains('presentatie-weergave');
        if (wordtGroot) {
            zoomVoorPresentatie = weergaveZoom;
            workspace.classList.add('presentatie-weergave');
            grootTonenKnop.textContent = '✕ Sluit grote weergave';
            stelWeergaveZoomIn(Math.max(1.5, weergaveZoom));
        } else {
            workspace.classList.remove('presentatie-weergave');
            grootTonenKnop.textContent = '⛶ Groot tonen';
            stelWeergaveZoomIn(zoomVoorPresentatie);
        }
        requestAnimationFrame(pasCanvasInWerkruimte);
    });

    const werkruimteElement = document.querySelector('.workspace .pagina-container');
    if (werkruimteElement && 'ResizeObserver' in window) {
        new ResizeObserver(planCanvasAanpassing).observe(werkruimteElement);
    }
    window.addEventListener('resize', planCanvasAanpassing);

    // --- LEGENDE KLEUREN TOEPASSEN / VERWIJDEREN ---
    function verzamelZichtbareOnderdelen(obj) {
        const onderdelen = [];
        const bezoek = (item) => {
            if (!item || item.isNaam) return;
            if (item.isType?.('group')) item.getObjects().forEach(bezoek);
            else onderdelen.push(item);
        };
        bezoek(obj);
        return onderdelen;
    }

    function setCanvasColorsFromLegend(show) {
        canvas.forEachObject(obj => {
            const objectType = obj.voorwerpType;
            if (!objectType || obj.isNaam) return;
            const type = normaliseerLegendeType(objectType);

            const legendInfo = gebruikteLegendeItems.get(type);
            const color = (legendInfo && legendInfo.kleur) ? legendInfo.kleur : null;

            if (obj.isType('image')) {
                let newFilters = [];
                if (show && color) {
                    newFilters.push(new fabric.Image.filters.BlendColor({ color, mode: 'multiply', alpha: 1.0 }));
                }
                obj.filters = newFilters;
                obj.applyFilters();
            } else if (obj.isType('group')) {
                if (type === 'deur') {
                    const path = verzamelZichtbareOnderdelen(obj).find(o => o.type === 'path');
                    if(path) path.set('stroke', show && color ? color : defaultStyles.deur.pathStroke);
                } else if (type === 'schoolbordFlappen') {
                    const objectsToColor = verzamelZichtbareOnderdelen(obj);
                    objectsToColor.forEach((item, i) => {
                        item.set('fill', show && color ? color : (item.standaardVulling ?? defaultStyles.schoolbordFlappen[i]?.fill ?? 'transparent'));
                    });
                } else {
                    verzamelZichtbareOnderdelen(obj).forEach(item => {
                         if (item.nietInkleuren) return;
                         if (item.isType('image')) {
                             let newFilters = [];
                             if (show && color) {
                                 newFilters.push(new fabric.Image.filters.BlendColor({ color, mode: 'multiply', alpha: 1.0 }));
                             }
                             item.filters = newFilters;
                             item.applyFilters();
                         } else {
                             item.set('fill', show && color ? color : (item.standaardVulling ?? 'transparent'));
                         }
                    });
                }
            } else if (type === 'schoolbord') {
                obj.set('fill', show && color ? color : defaultStyles.schoolbord.fill);
            } else if (type !== 'muur' && type !== 'raam' && type !== 'paal') {
                obj.set('fill', show && color ? color : 'transparent');
            }
        });
        canvas.renderAll();
    }

    // --- FORMAAT WISSELEN ---
    function wisselCanvasFormaat() {
        const wasRasterZichtbaar = gridVisible;
        const json = canvas.toJSON(customProperties);
        const oldWidth = canvas.getWidth();
        const oldHeight = canvas.getHeight();
        canvas.setWidth(oldHeight);
        canvas.setHeight(oldWidth);
        canvas.loadFromJSON(json, () => {
            canvas.renderAll();
            requestAnimationFrame(pasCanvasInWerkruimte);
            if (wasRasterZichtbaar) tekenRaster();
        });
        setTimeout(saveStateImmediate, 200);
    }
    formaatWisselKnop.addEventListener('click', wisselCanvasFormaat);
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => { clearTimeout(timeout); func(...args); };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // --- HELPER OM KLEUREN AAN TE ZETTEN VOOR OPSLAAN ---
    async function withColorsOn(func) {
        const colorsWereOff = !legendeTonenToggle.checked;
        if (colorsWereOff) {
            setCanvasColorsFromLegend(true);
        }
        await func();
        if (colorsWereOff) {
            setCanvasColorsFromLegend(false);
        }
    }

    // --- AUTOMATISCH OPSLAAN & HERLADEN ---
    function slaCanvasOpInBrowser() {
        if (isUpdatingState) return;
        withColorsOn(() => {
            try {
                const json = JSON.stringify(canvas.toJSON(customProperties));
                localStorage.setItem('plattegrondData', json);
            } catch (e) {
                if (e.name === 'QuotaExceededError') {
                    console.error("LocalStorage quota overschreden. Automatisch opslaan is uitgeschakeld.");
                    if (!window.quotaExceededNotified) {
                        alert("De plattegrond is te groot geworden voor automatisch opslaan in de browser. Exporteer uw werk handmatig om verlies te voorkomen.");
                        window.quotaExceededNotified = true;
                    }
                } else {
                    console.error("Kon niet opslaan naar localStorage:", e);
                }
            }
        });
    }
    function laadCanvasUitBrowser() {
        const opgeslagenData = localStorage.getItem('plattegrondData');
        if (opgeslagenData) {
            if (confirm("Er is een opgeslagen tekening gevonden. Wilt u deze herstellen?")) {
                laadJsonData(opgeslagenData);
            } else {
                localStorage.removeItem('plattegrondData');
                startNieuweTekening(false);
            }
        } else {
            startNieuweTekening(false);
        }
    }
    function startNieuweTekening(vraagBevestiging = true) {
        if (vraagBevestiging && !confirm("Weet u zeker dat u alles wilt wissen en opnieuw wilt beginnen?")) return;
        isUpdatingState = true;
        canvas.clear();
        canvas.backgroundColor = '#fff';
        isUpdatingState = false;
        rasterToggle.checked = false;
        gridVisible = false;
        metrischeModusActief = false;
        gridSize = 20;
        maatPaneel?.classList.add('verborgen');
        if (schaalInfo) schaalInfo.textContent = 'Vrij tekenen · raster zonder verplichte schaal';
        canvas.remove(gridGroup);
        rebuildLegendFromCanvas();
        canvas.renderAll();
        localStorage.removeItem('plattegrondData');
        const emptyState = JSON.stringify(canvas.toJSON(customProperties));
        history = [emptyState];
        redoStack = [];
        updateUndoRedoButtons();
        schakelModus('bouw');
    }
    nieuwKnop.addEventListener('click', () => startNieuweTekening(true));

    // --- UNDO / REDO ---
    const saveState = debounce(() => {
        if (isUpdatingState || isWisselModusActief || canvas.isDrawingMode) return;
        redoStack = [];
        const jsonState = JSON.stringify(canvas.toJSON(customProperties));
        history.push(jsonState);
        slaCanvasOpInBrowser();
        updateUndoRedoButtons();
    }, 300);
    function saveStateImmediate() {
        if (isUpdatingState || isWisselModusActief || canvas.isDrawingMode) return;
        redoStack = [];
        const jsonState = JSON.stringify(canvas.toJSON(customProperties));
        history.push(jsonState);
        slaCanvasOpInBrowser();
        updateUndoRedoButtons();
    }
    function undo() {
        if (history.length > 1) {
            isUpdatingState = true;
            redoStack.push(history.pop());
            const prevState = history[history.length - 1];
            laadJsonData(prevState, true);
        }
        updateUndoRedoButtons();
    }
    function redo() {
        if (redoStack.length > 0) {
            isUpdatingState = true;
            const nextState = redoStack.pop();
            history.push(nextState);
            laadJsonData(nextState, true);
        }
        updateUndoRedoButtons();
    }
    function updateUndoRedoButtons() {
        undoKnop.disabled = history.length <= 1;
        redoKnop.disabled = redoStack.length === 0;
    }
    canvas.on('object:added', saveStateImmediate);
    canvas.on('object:modified', saveState);
    canvas.on('path:created', saveStateImmediate);
    undoKnop.addEventListener('click', undo);
    redoKnop.addEventListener('click', redo);

    // --- JSON IMP/EXP (gecorrigeerd) ---
    function laadJsonData(jsonData, isUndoRedo = false) {
        const modusVoorLaden = modus;
        isUpdatingState = true;
        canvas.clear();
        rasterToggle.checked = false;
        gridVisible = false;
        metrischeModusActief = false;

        const data = JSON.parse(jsonData);
        if (data.width && data.height) {
            canvas.setWidth(data.width);
            canvas.setHeight(data.height);
        }

        canvas.loadFromJSON(jsonData, () => {
            const objectsToRemove = canvas.getObjects().filter(obj =>
                (obj.type === 'line' && obj.stroke === '#ddd' && !obj.selectable) ||
                (obj.type === 'group' && obj.getObjects().length > 10 && obj.getObjects()[0].stroke === '#ddd')
            );
            objectsToRemove.forEach(obj => canvas.remove(obj));

            const schaalLabel = canvas.getObjects().find(obj => obj.gridPixelSize && obj.metersPerGrid);
            if (schaalLabel) {
                gridSize = schaalLabel.gridPixelSize;
                metrischeModusActief = true;
                gridVisible = true;
                rasterToggle.checked = true;
                tekenRaster();
            }

            if (!isUndoRedo) {
                const stateToStore = JSON.stringify(canvas.toJSON(customProperties));
                history = [stateToStore];
                redoStack = [];
                updateUndoRedoButtons();
            }
            schakelModus(isUndoRedo ? modusVoorLaden : 'bouw', true);
            setNamenZichtbaarheid(namenTonenToggle.checked);
            if (isUndoRedo) updateLegendeWeergave();
            else rebuildLegendFromCanvas();
            setCanvasColorsFromLegend(legendeTonenToggle.checked);
            canvas.renderAll();
            requestAnimationFrame(() => requestAnimationFrame(pasCanvasInWerkruimte));

            // --- DE FIX ---
            // De veiligheidsvlag wordt pas hier uitgezet, nadat ALLE operaties klaar zijn.
            isUpdatingState = false;
        });
    }
    exporteerJsonKnop.addEventListener('click', () => {
        withColorsOn(() => {
            const json = canvas.toJSON(customProperties);
            json.width = canvas.getWidth();
            json.height = canvas.getHeight();
            const blob = new Blob([JSON.stringify(json)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = 'klasplattegrond.json';
            document.body.appendChild(a); a.click();
            document.body.removeChild(a); URL.revokeObjectURL(url);
        });
    });
    importeerJsonKnop.addEventListener('click', () => jsonFileInput.click());
    jsonFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try { laadJsonData(event.target.result); }
            catch { alert("Fout bij het importeren. Is dit een geldig plattegrond-bestand?"); }
        };
        reader.readAsText(file); e.target.value = '';
    });

    // --- WISSELMODUS ---
    function startPlaatsenWisselen() {
        const groepen = canvas.getObjects().filter(obj => obj.studentNaam);
        if (groepen.length === 0) { alert("Er zijn geen namen op de plattegrond om te wisselen."); return; }
        isWisselModusActief = true; schakelModus('wissel'); modusKnoppen.wissel.innerHTML = '<b>✓ Klaar met wisselen</b><small>Bewaar de nieuwe plaatsen</small>';
        let clonesDone = 0; const clonedMeubels = []; const namenVoorWachtruimte = [];
        groepen.forEach(groep => {
            const meubel = groep.getObjects().find(item => !item.isNaam);
            const naam = groep.studentNaam;
            if (meubel) {
                meubel.clone(kloon => {
                    kloon.set({ left: groep.getCenterPoint().x, top: groep.getCenterPoint().y,
                        angle: groep.angle, originX: 'center', originY: 'center',
                        selectable: false, evented: false });
                    clonedMeubels.push(kloon); namenVoorWachtruimte.push(naam);
                    clonesDone++;
                    if (clonesDone === groepen.length) {
                        groepen.forEach(g => canvas.remove(g));
                        clonedMeubels.forEach(m => canvas.add(m));
                        namenLijst.innerHTML = '';
                        namenVoorWachtruimte.forEach(n => {
                            const naamItem = document.createElement('div');
                            naamItem.className = 'naam-item'; naamItem.draggable = true;
                            naamItem.textContent = n.trim(); naamItem.dataset.naam = n.trim();
                            namenLijst.appendChild(naamItem);
                        });
                        namenWachtlijstContainer.classList.remove('verborgen');
                        canvas.renderAll();
                    }
                }, customProperties);
            } else {
                clonesDone++; if (clonesDone === groepen.length) { groepen.forEach(g => canvas.remove(g)); canvas.renderAll(); }
            }
        });
        namenLijst.addEventListener('dragstart', handleDragStart);
        canvas.upperCanvasEl.addEventListener('dragover', handleDragOver);
        canvas.upperCanvasEl.addEventListener('drop', handleDrop);
    }
    function stopPlaatsenWisselen() {
        if (namenLijst.children.length > 0) {
            if (!confirm("Er staan nog namen in de wachtruimte. Stoppen? Niet-geplaatste namen worden verwijderd.")) return;
        }
        isWisselModusActief = false; modusKnoppen.wissel.innerHTML = '<b>🔄 Wissel plaatsen</b><small>Verplaats leerlingen snel</small>';
        namenWachtlijstContainer.classList.add('verborgen'); namenLijst.innerHTML = '';
        namenLijst.removeEventListener('dragstart', handleDragStart);
        canvas.upperCanvasEl.removeEventListener('dragover', handleDragOver);
        canvas.upperCanvasEl.removeEventListener('drop', handleDrop);
        let teVerwijderen = []; let teGroeperen = new Map();
        canvas.forEachObject(obj => {
            if (obj.isNaam) {
                const meubel = canvas.getObjects().find(m => m.gekoppeldAan === obj.studentNaam);
                if (meubel) teGroeperen.set(obj.studentNaam, { naamObj: obj, meubelObj: meubel });
                else teVerwijderen.push(obj);
            }
        });
        teGroeperen.forEach(({ naamObj, meubelObj }) => {
            groepeerNaamMetObject(naamObj.studentNaam, meubelObj);
            teVerwijderen.push(naamObj, meubelObj);
        });
        teVerwijderen.forEach(obj => canvas.remove(obj));
        canvas.forEachObject(obj => { if (obj.voorwerpType) obj.set({ gekkoppeldAan: null }); obj.set({ selectable: true, evented: true }); });
        schakelModus('meubel'); saveStateImmediate();
    }
    function handleDragStart(e){ e.dataTransfer.setData('text/plain', e.target.dataset.naam); e.dataTransfer.effectAllowed='move'; }
    function handleDragOver(e){ e.preventDefault(); e.dataTransfer.dropEffect='move'; }
    function handleDrop(e){
        e.preventDefault();
        const naam = e.dataTransfer.getData('text/plain').trim(); if (!naam) return;
        const pointer = canvas.getPointer(e);
        const meubels = canvas.getObjects().filter(obj => obj.voorwerpType && !obj.isNaam);
        const doelMeubel = meubels.reverse().find(m => m.containsPoint(pointer));
        if (!doelMeubel) return;
        const zittendeNaam = doelMeubel.gekoppeldAan;
        if (zittendeNaam && zittendeNaam !== naam) {
            const zittendeNaamObject = canvas.getObjects().find(o => o.isNaam && o.studentNaam === zittendeNaam);
            if (zittendeNaamObject) canvas.remove(zittendeNaamObject);
            doelMeubel.set('gekoppeldAan', null);
            const naamItem = document.createElement('div');
            naamItem.className = 'naam-item'; naamItem.draggable = true;
            naamItem.textContent = zittendeNaam; naamItem.dataset.naam = zittendeNaam;
            namenLijst.appendChild(naamItem);
        }
        const gesleepteNaamElement = Array.from(namenLijst.children).find(el => el.dataset.naam === naam);
        if (gesleepteNaamElement) gesleepteNaamElement.remove();
        const alGeplaatsteNaam = canvas.getObjects().find(obj => obj.studentNaam === naam && obj.isNaam);
        if (alGeplaatsteNaam) canvas.remove(alGeplaatsteNaam);
        const tekst = new fabric.IText(naam, {
            left: doelMeubel.getCenterPoint().x, top: doelMeubel.getCenterPoint().y,
            fontSize: 16, fontFamily: 'Arial', originX: 'center', originY: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.9)', padding: 4,
            studentNaam: naam, isNaam: true, selectable: true
        });
        doelMeubel.set('gekoppeldAan', naam);
        canvas.add(tekst); canvas.renderAll();
    }
    canvas.on('object:modified', (e) => {
        if (!isWisselModusActief || !e.target.isNaam) return;
        const naamObject = e.target;
        const meubels = canvas.getObjects().filter(obj => obj.voorwerpType && !obj.isNaam);
        const vorigMeubel = meubels.find(m => m.gekoppeldAan === naamObject.studentNaam);
        const doelMeubel = meubels.find(m => m.containsPoint(naamObject.getCenterPoint()));
        if (doelMeubel && doelMeubel !== vorigMeubel) {
            const zittendeNaam = doelMeubel.gekoppeldAan;
            if (zittendeNaam && vorigMeubel) {
                const zittendeNaamObject = canvas.getObjects().find(o => o.isNaam && o.studentNaam === zittendeNaam);
                if (zittendeNaamObject) {
                    zittendeNaamObject.set({ left: vorigMeubel.getCenterPoint().x, top: vorigMeubel.getCenterPoint().y });
                    vorigMeubel.set('gekoppeldAan', zittendeNaam);
                    zittendeNaamObject.setCoords();
                }
            } else if (vorigMeubel) {
                vorigMeubel.set('gekoppeldAan', null);
            }
            naamObject.set({ left: doelMeubel.getCenterPoint().x, top: doelMeubel.getCenterPoint().y });
            doelMeubel.set('gekoppeldAan', naamObject.studentNaam);
        } else if (!doelMeubel && vorigMeubel) {
            vorigMeubel.set('gekoppeldAan', null);
        } else if (vorigMeubel) {
            naamObject.set({ left: vorigMeubel.getCenterPoint().x, top: vorigMeubel.getCenterPoint().y });
        }
        naamObject.setCoords(); canvas.requestRenderAll();
    });
    function schakelModus(nieuweModus) {
        if (nieuweModus !== 'bouw' && bouwTool === 'gom') zetBouwTool('');
        modus = nieuweModus; canvas.isDrawingMode = false;
        updateModusUitleg(nieuweModus);
        Object.values(modusKnoppen).forEach(knop => knop.classList.remove('actief'));
        if (modusKnoppen[nieuweModus]) modusKnoppen[nieuweModus].classList.add('actief');
        Object.values(werkbalken).forEach(balk => balk.classList.add('verborgen'));
        if (werkbalken[nieuweModus]) werkbalken[nieuweModus].classList.remove('verborgen');
        legendeContainer.classList.toggle('verborgen', nieuweModus !== 'legende');
        brengModusGereedschapInBeeld(nieuweModus);
        const isInteractief = !['legende', 'wissel'].includes(nieuweModus);
        canvas.selection = isInteractief; canvas.defaultCursor = 'default';
        canvas.forEachObject(obj => {
            if (obj === gridGroup || obj.excludeFromExport || obj.gridPixelSize) {
                obj.set({ selectable: false, evented: false });
                return;
            }
            if (nieuweModus === 'wissel') obj.set({ selectable: obj.isNaam });
            else obj.set({ selectable: isInteractief });
            if (obj.voorwerpType === 'muur') obj.set({ evented: (modus === 'bouw') });
        });
        canvas.renderAll();
    }
    Object.keys(modusKnoppen).forEach(key => {
        if(key !== 'wissel') modusKnoppen[key].addEventListener('click', () => schakelModus(key));
        else modusKnoppen[key].addEventListener('click', () => { if (isWisselModusActief) { stopPlaatsenWisselen(); } else { startPlaatsenWisselen(); }});
    });
    function tekenRaster() {
        canvas.remove(gridGroup);
        const width = canvas.getWidth(), height = canvas.getHeight();
        const lines = [];
        const lineOptions = { stroke: '#ddd', selectable: false, evented: false, excludeFromExport: true };
        const kolommen = Math.floor(width / gridSize);
        const rijen = Math.floor(height / gridSize);
        const rasterBreedte = kolommen * gridSize;
        const rasterHoogte = rijen * gridSize;
        for (let i = 0; i <= kolommen; i++) {
            lines.push(new fabric.Line([i * gridSize, 0, i * gridSize, rasterHoogte], lineOptions));
        }
        for (let i = 0; i <= rijen; i++) {
            lines.push(new fabric.Line([0, i * gridSize, rasterBreedte, i * gridSize], lineOptions));
        }
        gridGroup = new fabric.Group(lines, { selectable: false, evented: false, excludeFromExport: true });
        canvas.add(gridGroup); gridGroup.moveTo(0); canvas.renderAll();
    }
    rasterToggle.addEventListener('change', (e) => {
        gridVisible = e.target.checked;
        if (gridVisible) tekenRaster(); else { canvas.remove(gridGroup); canvas.renderAll(); }
    });

    // --- MEETWIZARD: VAN ECHTE METERS NAAR EEN PLAN OP RUITJES ---
    const meetWizard = document.getElementById('meetWizard');
    const meetWizardForm = document.getElementById('meetWizardForm');
    const binnenlokaalVelden = document.getElementById('binnenlokaalVelden');
    const heeftBinnenlokaal = document.getElementById('heeftBinnenlokaal');
    const meetWizardFout = document.getElementById('meetWizardFout');
    const schaalInfo = document.getElementById('schaalInfo');

    function leesPositiefGetal(id) {
        return Number.parseFloat(document.getElementById(id).value.replace?.(',', '.') || document.getElementById(id).value);
    }

    function maakMeetMuur(x1, y1, x2, y2) {
        const muur = new fabric.Line([x1, y1, x2, y2], {
            stroke: 'black', strokeWidth: 5, strokeUniform: true, voorwerpType: 'muur',
            originX: 'center', originY: 'center', lockScalingFlip: true, metrischeSchaal: true
        });
        maakInteractief(muur);
        canvas.add(muur);
        return muur;
    }

    function tekenRechthoekInMeters(xM, yM, breedteM, hoogteM, oorsprongX, oorsprongY) {
        const pxPerMeter = gridSize / metersPerGrid;
        const x = oorsprongX + xM * pxPerMeter;
        const y = oorsprongY + yM * pxPerMeter;
        const rechts = x + breedteM * pxPerMeter;
        const onder = y + hoogteM * pxPerMeter;
        maakMeetMuur(x, y, rechts, y);
        maakMeetMuur(rechts, y, rechts, onder);
        maakMeetMuur(rechts, onder, x, onder);
        maakMeetMuur(x, onder, x, y);
    }

    function tekenKlasUitMetingen(e) {
        e.preventDefault();
        meetWizardFout.textContent = '';
        const lengte = leesPositiefGetal('klasLengte');
        const breedte = leesPositiefGetal('klasBreedte');
        if (!(lengte > 0) || !(breedte > 0)) {
            meetWizardFout.textContent = 'Vul een geldige lengte en breedte in.';
            return;
        }

        let binnen = null;
        if (heeftBinnenlokaal.checked) {
            binnen = {
                lengte: leesPositiefGetal('binnenLengte'), breedte: leesPositiefGetal('binnenBreedte'),
                links: leesPositiefGetal('binnenLinks'), boven: leesPositiefGetal('binnenBoven')
            };
            const geldig = binnen.lengte > 0 && binnen.breedte > 0 && binnen.links >= 0 && binnen.boven >= 0 &&
                binnen.links + binnen.breedte <= breedte && binnen.boven + binnen.lengte <= lengte;
            if (!geldig) {
                meetWizardFout.textContent = 'Het binnenlokaal past met deze maten niet volledig binnen de klas.';
                return;
            }
        }

        const echteObjecten = canvas.getObjects().filter(obj => obj !== gridGroup && !obj.excludeFromExport);
        if (echteObjecten.length && !confirm('De gemeten klas vervangt de huidige tekening. Wil je doorgaan?')) return;

        startNieuweTekening(false);
        metrischeModusActief = true;
        // Gebruik de bladstand die het best aansluit bij de gemeten klas.
        // Zo blijft een brede klas groot genoeg om meubels nauwkeurig te plaatsen.
        // Breedte loopt van links naar rechts; lengte loopt van boven naar beneden.
        const moetLiggend = breedte >= lengte;
        canvas.setWidth(moetLiggend ? 842 : 595);
        canvas.setHeight(moetLiggend ? 595 : 842);
        const margeRuitjes = 2;
        // Maak de ruitjes zo groot mogelijk voor comfortabel plaatsen van meubels.
        // Alleen bij zeer grote lokalen worden ze automatisch verkleind om alles te laten passen.
        gridSize = Math.max(12, Math.min(30,
            (canvas.getWidth() - 40) / (breedte / metersPerGrid + margeRuitjes),
            (canvas.getHeight() - 60) / (lengte / metersPerGrid + margeRuitjes)
        ));
        gridSize = Math.floor(gridSize * 2) / 2;
        const rasterKolommen = Math.floor(canvas.getWidth() / gridSize);
        const rasterRijen = Math.floor(canvas.getHeight() / gridSize);
        const klasKolommen = breedte / metersPerGrid;
        const klasRijen = lengte / metersPerGrid;
        // Centreer op hele rasterlijnen. Bij een oneven rest blijft hoogstens één
        // ruit verschil tussen beide marges over.
        const oorsprongX = Math.max(1, Math.floor((rasterKolommen - klasKolommen) / 2)) * gridSize;
        const oorsprongY = Math.max(1, Math.floor((rasterRijen - klasRijen) / 2)) * gridSize;

        isUpdatingState = true;
        rasterToggle.checked = true;
        gridVisible = true;
        tekenRaster();
        tekenRechthoekInMeters(0, 0, breedte, lengte, oorsprongX, oorsprongY);
        if (binnen) tekenRechthoekInMeters(binnen.links, binnen.boven, binnen.breedte, binnen.lengte, oorsprongX, oorsprongY);
        const label = new fabric.Text(`1 ruitje = ${metersPerGrid.toString().replace('.', ',')} m`, {
            left: oorsprongX, top: 4, fontSize: 13, fontFamily: 'Arial', fill: '#173b61',
            fontWeight: 'bold', selectable: false, evented: false, metrischeSchaal: true,
            gridPixelSize: gridSize, metersPerGrid
        });
        canvas.add(label);
        gridGroup.moveTo(0);
        isUpdatingState = false;
        schaalInfo.textContent = `1 ruitje = 0,5 m · klas ${lengte} × ${breedte} m`;
        canvas.discardActiveObject();
        canvas.renderAll();
        requestAnimationFrame(pasCanvasInWerkruimte);
        saveStateImmediate();
        meetWizard.close();
    }

    document.getElementById('meetWizardKnop').addEventListener('click', () => meetWizard.showModal());
    document.getElementById('meetWizardSluiten').addEventListener('click', () => meetWizard.close());
    document.getElementById('meetWizardAnnuleren').addEventListener('click', () => meetWizard.close());
    heeftBinnenlokaal.addEventListener('change', () => binnenlokaalVelden.classList.toggle('verborgen', !heeftBinnenlokaal.checked));
    meetWizardForm.addEventListener('submit', tekenKlasUitMetingen);

    function schaalMeubelOpWerkelijkeMaat(obj, type) {
        const maat = meubelMaten[type];
        if (!maat) return obj;
        const pxPerMeter = gridSize / metersPerGrid;
        obj.set({
            scaleX: (maat[0] * pxPerMeter) / obj.width,
            scaleY: (maat[1] * pxPerMeter) / obj.height,
            echteBreedteM: maat[0], echteDiepteM: maat[1], metrischeSchaal: true,
            lockScalingX: true, lockScalingY: true
        });
        // Fabric bewaart anders soms nog de bedieningspunten van de oude PNG-/symboolgrootte.
        obj.setCoords();
        return obj;
    }

    function geselecteerdMaatObject() {
        const obj = canvas.getActiveObject();
        return metrischeModusActief && obj && meubelMaten[obj.voorwerpType] ? obj : null;
    }

    function werkMaatPaneelBij() {
        const obj = geselecteerdMaatObject();
        maatPaneel.classList.toggle('verborgen', !obj);
        if (!obj) return;
        const typeNaam = legendeNamen[obj.voorwerpType] || obj.voorwerpType;
        maatType.textContent = `${typeNaam} · echte maat op het plan`;
        maatBreedte.value = Number(obj.echteBreedteM || 0).toFixed(2);
        maatDiepte.value = Number(obj.echteDiepteM || 0).toFixed(2);
        maatVast.checked = !!(obj.lockScalingX && obj.lockScalingY);
    }

    function pasIngevoerdeMaatToe() {
        const obj = geselecteerdMaatObject();
        if (!obj) return;
        const breedteM = Number.parseFloat(maatBreedte.value.replace(',', '.'));
        const diepteM = Number.parseFloat(maatDiepte.value.replace(',', '.'));
        if (!(breedteM > 0) || !(diepteM > 0)) return;
        const pxPerMeter = gridSize / metersPerGrid;
        obj.set({
            scaleX: (breedteM * pxPerMeter) / obj.width,
            scaleY: (diepteM * pxPerMeter) / obj.height,
            echteBreedteM: breedteM, echteDiepteM: diepteM, metrischeSchaal: true
        });
        obj.setCoords();
        canvas.requestRenderAll();
        saveStateImmediate();
    }

    maatBreedte.addEventListener('change', pasIngevoerdeMaatToe);
    maatDiepte.addEventListener('change', pasIngevoerdeMaatToe);
    maatVast.addEventListener('change', () => {
        const obj = geselecteerdMaatObject();
        if (!obj) return;
        obj.set({ lockScalingX: maatVast.checked, lockScalingY: maatVast.checked });
        canvas.requestRenderAll();
        saveStateImmediate();
    });
    maatStandaardKnop.addEventListener('click', () => {
        const obj = geselecteerdMaatObject();
        if (!obj) return;
        const maat = meubelMaten[obj.voorwerpType];
        maatBreedte.value = maat[0];
        maatDiepte.value = maat[1];
        pasIngevoerdeMaatToe();
        werkMaatPaneelBij();
    });
    canvas.on('selection:created', werkMaatPaneelBij);
    canvas.on('selection:updated', werkMaatPaneelBij);
    canvas.on('selection:cleared', werkMaatPaneelBij);
    canvas.on('object:modified', (event) => {
        const obj = event.target;
        if (!obj || !meubelMaten[obj.voorwerpType] || (obj.lockScalingX && obj.lockScalingY)) return;
        const pxPerMeter = gridSize / metersPerGrid;
        obj.set({
            echteBreedteM: Number((obj.getScaledWidth() / pxPerMeter).toFixed(2)),
            echteDiepteM: Number((obj.getScaledHeight() / pxPerMeter).toFixed(2)),
            metrischeSchaal: true
        });
        werkMaatPaneelBij();
    });

    document.querySelectorAll('#meubel-werkbalk button[data-type]').forEach(knop => {
        const maat = meubelMaten[knop.dataset.type];
        if (maat) knop.title = `In schaalmodus: ${maat[0].toString().replace('.', ',')} × ${maat[1].toString().replace('.', ',')} m`;
    });
    const gomKnop = document.getElementById('plaatsGomKnop');
    function zetBouwTool(nieuweTool) {
        bouwTool = nieuweTool;
        canvas.isDrawingMode = (bouwTool === 'gom');
        gomKnop.classList.toggle('actief', bouwTool === 'gom');
        gomKnop.textContent = bouwTool === 'gom' ? '✓ Gom actief' : 'Gom';
        if (bouwTool !== 'gom') canvas.defaultCursor = 'default';
    }
    document.getElementById('tekenMuurKnop').addEventListener('click', () => zetBouwTool('muur'));
    document.getElementById('plaatsKlasKnop').addEventListener('click', () => {
        zetBouwTool('klas');
        const klasRechthoek = new fabric.Rect({ left: 100, top: 100, width: 400, height: 300, fill: 'transparent', stroke: 'black', strokeWidth: 5, strokeUniform: true, voorwerpType: 'muur', originX: 'left', originY: 'top' });
        maakInteractief(klasRechthoek); canvas.add(klasRechthoek); canvas.setActiveObject(klasRechthoek); canvas.renderAll();
    });
    document.getElementById('plaatsDeurKnop').addEventListener('click', () => {
        zetBouwTool('deur');
        const deurSymbol = new fabric.Path('M 0 0 L 0 40 M 0 0 Q 40 0 40 40', { fill: '', stroke: 'black', strokeWidth: 2 });
        const achtergrond = new fabric.Rect({ left: -2, top: -3, width: 46, height: 12, fill: canvas.backgroundColor, originX: 'left', originY: 'top' });
        const deur = new fabric.Group([achtergrond, deurSymbol], { left: 50, top: 50, voorwerpType: 'deur', originX: 'left', originY: 'top' });
        maakInteractief(deur); if (metrischeModusActief) schaalMeubelOpWerkelijkeMaat(deur, 'deur'); canvas.add(deur); deur.setCoords(); canvas.setActiveObject(deur); canvas.renderAll(); werkMaatPaneelBij();
    });
    document.getElementById('plaatsRaamKnop').addEventListener('click', () => {
        zetBouwTool('raam');
        const raamAchtergrond = new fabric.Rect({ left: 0, top: 0, width: 80, height: 8, fill: canvas.backgroundColor, strokeWidth: 0 });
        const glasBoven = new fabric.Line([4, 2, 76, 2], { stroke: '#6cace4', strokeWidth: 1.8 });
        const glasOnder = new fabric.Line([4, 6, 76, 6], { stroke: '#6cace4', strokeWidth: 1.8 });
        const raam = new fabric.Group([raamAchtergrond, glasBoven, glasOnder], { left: 50, top: 100, voorwerpType: 'raam' });
        maakInteractief(raam); if (metrischeModusActief) schaalMeubelOpWerkelijkeMaat(raam, 'raam'); canvas.add(raam); raam.setCoords(); canvas.setActiveObject(raam); canvas.renderAll(); werkMaatPaneelBij();
    });
    gomKnop.addEventListener('click', () => {
        if (bouwTool === 'gom') {
            zetBouwTool('');
            return;
        }
        zetBouwTool('gom');
        canvas.freeDrawingBrush.color = canvas.backgroundColor;
        canvas.freeDrawingBrush.width = 12;
        canvas.freeDrawingBrush.strokeLineCap = 'square';
        canvas.freeDrawingBrush.strokeLineJoin = 'miter';
        canvas.freeDrawingCursor = 'crosshair';
    });
    document.getElementById('plaatsPaalKnop').addEventListener('click', () => {
        zetBouwTool('paal');
        const paal = new fabric.Rect({ left: 100, top: 100, width: gridSize, height: gridSize, fill: '#333', stroke: '#333', strokeWidth: 1, voorwerpType: 'paal' });
        maakInteractief(paal); canvas.add(paal); canvas.setActiveObject(paal); canvas.renderAll();
    });
    canvas.on('mouse:down', (o) => {
        if (modus === 'bouw' && bouwTool === 'muur' && !isDrawingWall) {
             isDrawingWall = true;
             const p = canvas.getPointer(o.e);
             wallStartPoint = { x: Math.round(p.x / gridSize) * gridSize, y: Math.round(p.y / gridSize) * gridSize };
        }
    });

    // ##################################################################
    // ### START VAN DE CORRECTIE VOOR "MUUR PER MUUR" ###
    // ##################################################################
    canvas.on('mouse:up', (o) => {
        if (!isDrawingWall) return;
        isDrawingWall = false;
        const p = canvas.getPointer(o.e);
        let endX = Math.round(p.x / gridSize) * gridSize;
        let endY = Math.round(p.y / gridSize) * gridSize;

        if (o.e.shiftKey) {
            const dx = Math.abs(endX - wallStartPoint.x);
            const dy = Math.abs(endY - wallStartPoint.y);
            if (dx > dy) {
                endY = wallStartPoint.y;
            } else {
                endX = wallStartPoint.x;
            }
        }

        const muur = new fabric.Line([wallStartPoint.x, wallStartPoint.y, endX, endY], {
            stroke: 'black',
            strokeWidth: 5,
            strokeUniform: true,
            voorwerpType: 'muur',
            originX: 'center',
            originY: 'center',
            lockScalingFlip: true
        });

        maakInteractief(muur);
        canvas.add(muur);
        canvas.setActiveObject(muur);
        canvas.renderAll();
        bouwTool = '';
    });
    // ##################################################################
    // ### EINDE VAN DE CORRECTIE ###
    // ##################################################################

    werkbalken.meubel.addEventListener('click', (e) => {
        if (e.target.tagName !== 'BUTTON') return;
        const type = e.target.dataset.type;
        const renderCallback = (obj) => { if (metrischeModusActief) schaalMeubelOpWerkelijkeMaat(obj, type); canvas.add(obj); obj.setCoords(); canvas.setActiveObject(obj); canvas.renderAll(); werkMaatPaneelBij(); };
        if (type === 'schoolbank') {
            const tafelblad = new fabric.Rect({
                left: 0, top: 24, width: 110, height: 38, rx: 2, ry: 2,
                fill: '#fff', standaardVulling: '#fff', stroke: '#3f4a54', strokeWidth: 2, strokeUniform: true
            });
            const stoel = new fabric.Rect({
                left: 34, top: 0, width: 42, height: 18, rx: 3, ry: 3,
                fill: '#fff', standaardVulling: '#fff', stroke: '#3f4a54', strokeWidth: 2, strokeUniform: true
            });
            const stoelZitting = new fabric.Line([39, 15, 71, 15], {
                stroke: '#3f4a54', strokeWidth: 2, strokeUniform: true
            });
            const bank = new fabric.Group([tafelblad, stoel, stoelZitting], {
                left: 100, top: 100, voorwerpType: type, originX: 'left', originY: 'top', objectCaching: false
            });
            if (!metrischeModusActief) bank.scaleToWidth(80);
            maakInteractief(bank); renderCallback(bank);
        } else if (type === 'dubbeleSchoolbank') {
            const dubbelBlad = new fabric.Rect({
                left: 0, top: 24, width: 120, height: 38, rx: 2, ry: 2,
                fill: '#fff', standaardVulling: '#fff', stroke: '#3f4a54', strokeWidth: 2, strokeUniform: true
            });
            const stoelLinks = new fabric.Rect({
                left: 17, top: 0, width: 34, height: 18, rx: 3, ry: 3,
                fill: '#fff', standaardVulling: '#fff', stroke: '#3f4a54', strokeWidth: 2, strokeUniform: true
            });
            const stoelRechts = new fabric.Rect({
                left: 69, top: 0, width: 34, height: 18, rx: 3, ry: 3,
                fill: '#fff', standaardVulling: '#fff', stroke: '#3f4a54', strokeWidth: 2, strokeUniform: true
            });
            const dubbeleBank = new fabric.Group([dubbelBlad, stoelLinks, stoelRechts], {
                left: 100, top: 100, voorwerpType: type, originX: 'left', originY: 'top', objectCaching: false
            });
            if (!metrischeModusActief) dubbeleBank.scaleToWidth(100);
            maakInteractief(dubbeleBank); renderCallback(dubbeleBank);
        } else if (type === 'bureau') {
            const bureaublad = new fabric.Rect({
                left: 0, top: 20, width: 140, height: 50, rx: 2, ry: 2,
                fill: '#fff', standaardVulling: '#fff', stroke: '#3f4a54', strokeWidth: 2, strokeUniform: true
            });
            const ladeLijn = new fabric.Line([100, 22, 100, 68], {
                stroke: '#7b8791', strokeWidth: 1.4, strokeUniform: true
            });
            const stoelJuf = new fabric.Rect({
                left: 50, top: 0, width: 40, height: 16, rx: 4, ry: 4,
                fill: '#fff', standaardVulling: '#fff', stroke: '#3f4a54', strokeWidth: 2, strokeUniform: true
            });
            const bureau = new fabric.Group([bureaublad, ladeLijn, stoelJuf], {
                left: 100, top: 100, voorwerpType: type, originX: 'left', originY: 'top', objectCaching: false
            });
            if (!metrischeModusActief) bureau.scaleToWidth(80);
            maakInteractief(bureau); renderCallback(bureau);
        } else if (type === 'kast') {
            const kastOmtrek = new fabric.Rect({
                left: 0, top: 0, width: 100, height: 45, rx: 1, ry: 1,
                fill: '#fff', standaardVulling: '#fff', stroke: '#3f4a54', strokeWidth: 2, strokeUniform: true
            });
            const deurScheiding = new fabric.Line([50, 2, 50, 43], {
                stroke: '#7b8791', strokeWidth: 1.4, strokeUniform: true
            });
            const handvatLinks = new fabric.Circle({
                left: 43, top: 21, radius: 1.8, fill: '#3f4a54', standaardVulling: '#3f4a54', originX: 'center', originY: 'center'
            });
            const handvatRechts = new fabric.Circle({
                left: 57, top: 21, radius: 1.8, fill: '#3f4a54', standaardVulling: '#3f4a54', originX: 'center', originY: 'center'
            });
            const kast = new fabric.Group([kastOmtrek, deurScheiding, handvatLinks, handvatRechts], {
                left: 100, top: 100, voorwerpType: type, originX: 'left', originY: 'top', objectCaching: false
            });
            if (!metrischeModusActief) kast.scaleToWidth(80);
            maakInteractief(kast); renderCallback(kast);
        } else if (type === 'wastafel') {
            const blad = new fabric.Rect({
                left: 0, top: 0, width: 60, height: 50, rx: 2, ry: 2,
                fill: '#fff', standaardVulling: '#fff', stroke: '#3f4a54', strokeWidth: 2, strokeUniform: true
            });
            const waskom = new fabric.Ellipse({
                left: 11, top: 12, rx: 19, ry: 13,
                fill: '#eef8fc', standaardVulling: '#eef8fc', stroke: '#4f8da8', strokeWidth: 1.7, strokeUniform: true
            });
            const afvoer = new fabric.Circle({
                left: 30, top: 25, radius: 2.3, fill: '#4f8da8', standaardVulling: '#4f8da8', originX: 'center', originY: 'center'
            });
            const kraan = new fabric.Path('M 30 12 L 30 6 Q 30 2 35 2 L 40 2', {
                fill: '', stroke: '#3f4a54', strokeWidth: 2, strokeUniform: true
            });
            const wastafel = new fabric.Group([blad, waskom, afvoer, kraan], {
                left: 100, top: 100, voorwerpType: type, originX: 'left', originY: 'top', objectCaching: false
            });
            if (!metrischeModusActief) wastafel.scaleToWidth(80);
            maakInteractief(wastafel); renderCallback(wastafel);
        } else if (type === 'kring') {
            const kringOnderdelen = [];
            kringOnderdelen.push(new fabric.Circle({
                left: 50, top: 50, radius: 31, originX: 'center', originY: 'center',
                fill: 'transparent', standaardVulling: 'transparent', nietInkleuren: true, stroke: '#6b7782', strokeWidth: 1.5, strokeDashArray: [4, 4], strokeUniform: true
            }));
            for (let i = 0; i < 8; i++) {
                const hoek = (Math.PI * 2 * i) / 8;
                kringOnderdelen.push(new fabric.Circle({
                    left: 50 + Math.cos(hoek) * 42, top: 50 + Math.sin(hoek) * 42, radius: 7,
                    originX: 'center', originY: 'center', fill: '#fff', standaardVulling: '#fff',
                    stroke: '#3f4a54', strokeWidth: 1.8, strokeUniform: true
                }));
            }
            const kring = new fabric.Group(kringOnderdelen, {
                left: 100, top: 100, voorwerpType: type, originX: 'left', originY: 'top', objectCaching: false
            });
            if (!metrischeModusActief) kring.scaleToWidth(80);
            maakInteractief(kring); renderCallback(kring);
        } else if (type === 'kringZitbank') {
            const zitting = new fabric.Rect({
                left: 0, top: 0, width: 120, height: 40, rx: 5, ry: 5,
                fill: '#fff', standaardVulling: '#fff', stroke: '#3f4a54',
                strokeWidth: 2, strokeUniform: true
            });
            const middenLijn = new fabric.Line([60, 3, 60, 37], {
                stroke: '#a1abb4', strokeWidth: 1.2, strokeUniform: true,
                nietInkleuren: true
            });
            const zitbank = new fabric.Group([zitting, middenLijn], {
                left: 100, top: 100, voorwerpType: type, originX: 'left', originY: 'top', objectCaching: false
            });
            if (!metrischeModusActief) zitbank.scaleToWidth(80);
            maakInteractief(zitbank); renderCallback(zitbank);
        } else if (type === 'leerlingBureau') {
            const bureauRect = new fabric.Rect({ width: 60, height: 40, fill: 'transparent', stroke: '#333', strokeWidth: 1, originX: 'center', originY: 'center' });
            const stoelCirkel = new fabric.Circle({ radius: 8, fill: 'transparent', stroke: '#333', strokeWidth: 1, left: 20, top: -10, originX: 'center', originY: 'center' });
            const leerlingBureauGroep = new fabric.Group([bureauRect, stoelCirkel], { left: 100, top: 100, voorwerpType: 'leerlingBureau', originX: 'left', originY: 'top' });
            maakInteractief(leerlingBureauGroep); renderCallback(leerlingBureauGroep);
        } else if (type === 'tafel') {
            const item = new fabric.Rect({ left: 100, top: 100, width: 80, height: 50, rx: 3, ry: 3, fill: '#fff', standaardVulling: '#fff', stroke: '#3f4a54', strokeWidth: 2, strokeUniform: true, voorwerpType: type, originX: 'left', originY: 'top' });
            maakInteractief(item); renderCallback(item);
        } else if (type === 'schoolbord') {
            const bord = new fabric.Rect({ left: 150, top: 50, width: 150, height: 10, fill: '#e6e6e6', standaardVulling: '#e6e6e6', stroke: '#263238', strokeWidth: 2, strokeUniform: true, voorwerpType: 'schoolbord', originX: 'left', originY: 'top' });
            maakInteractief(bord); renderCallback(bord);
        } else if (type === 'schoolbordFlappen') {
            const midden = new fabric.Rect({ width: 100, height: 10, fill: '#e6e6e6', standaardVulling: '#e6e6e6', stroke: '#263238', strokeWidth: 2, strokeUniform: true });
            const flapL = new fabric.Rect({ width: 50, height: 10, fill: '#f2f2f2', standaardVulling: '#f2f2f2', stroke: '#263238', strokeWidth: 2, strokeUniform: true, left: -50 });
            const flapR = new fabric.Rect({ width: 50, height: 10, fill: '#f2f2f2', standaardVulling: '#f2f2f2', stroke: '#263238', strokeWidth: 2, strokeUniform: true, left: 100 });
            const bordMetFlappen = new fabric.Group([midden, flapL, flapR], { left: 200, top: 100, voorwerpType: 'schoolbordFlappen', originX: 'left', originY: 'top' });
            maakInteractief(bordMetFlappen); renderCallback(bordMetFlappen);
        }
    });
    function groepeerNaamMetObject(naam, object) {
        const objAngle = object.angle || 0;
        const meubelBreedte = object.getScaledWidth();
        const metrischeNaam = metrischeModusActief && object.metrischeSchaal;
        const berekendeLettergrootte = metrischeNaam
            ? Math.max(8, Math.min(11, meubelBreedte / Math.max(naam.length * 0.58, 1)))
            : 16;
        const tekst = new fabric.IText(naam, {
            fontSize: berekendeLettergrootte,
            fontFamily: 'Arial',
            fill: '#172033',
            originX: 'center', originY: 'center',
            top: 0,
            backgroundColor: metrischeNaam ? 'rgba(255, 255, 255, 0.78)' : 'rgba(255, 255, 255, 0.9)',
            padding: metrischeNaam ? 1 : 4,
            angle: -objAngle,
            selectable: true,
            isNaam: true
        });
        const objPos = object.getCenterPoint();
        const objVoorwerpType = object.voorwerpType;
        object.set({ originX: 'center', originY: 'center', top: 0, left: 0, angle: 0 });
        const groep = new fabric.Group([object, tekst], {
            left: objPos.x, top: objPos.y, angle: objAngle, originX: 'center', originY: 'center',
            voorwerpType: objVoorwerpType, studentNaam: naam, subTargetCheck: true,
            echteBreedteM: object.echteBreedteM, echteDiepteM: object.echteDiepteM,
            metrischeSchaal: object.metrischeSchaal,
            lockScalingX: object.lockScalingX, lockScalingY: object.lockScalingY
        });
        maakInteractief(groep); canvas.add(groep);
    }
    document.getElementById('naamToevoegenKnop').addEventListener('click', () => {
        const naamInput = document.getElementById('naamInput');
        const naam = naamInput.value.trim();
        const actieveObject = canvas.getActiveObject();
        if (!actieveObject || !naam || actieveObject.studentNaam) return;
        groepeerNaamMetObject(naam, actieveObject); canvas.remove(actieveObject);
        naamInput.value = ''; canvas.renderAll();
    });
    function updateLegendeWeergave() {
        const container = document.getElementById('legende-weergave-container');
        const wrapper = document.getElementById('legende-weergave-wrapper');
        container.innerHTML = '';
        const moetZichtbaarZijn = legendeTonenToggle.checked && gebruikteLegendeItems.size > 0;
        if (!moetZichtbaarZijn) {
            wrapper.classList.add('verborgen');
            return;
        }
        wrapper.classList.remove('verborgen');
        gebruikteLegendeItems.forEach((waarde, type) => {
            if (!legendeNamen[type]) return;
            const { kleur } = waarde || {};
            const itemDiv = document.createElement('div');
            itemDiv.className = 'legende-weergave-item';
            const kleurDiv = document.createElement('div');
            kleurDiv.className = 'legende-weergave-kleur';
            // Ook zonder gekozen kleur blijft het vakje zichtbaar. Zo kan een
            // leerling de afgedrukte legende zelf met kleurpotloden invullen.
            kleurDiv.style.backgroundColor = kleur || '#fff';
            kleurDiv.style.visibility = 'visible';
            const icoonEl = maakIcoonElement(type);
            const tekstSpan = document.createElement('span');
            tekstSpan.className = 'legende-weergave-tekst';
            tekstSpan.textContent = legendeNamen[type] || type;
            itemDiv.appendChild(kleurDiv);
            itemDiv.appendChild(icoonEl);
            itemDiv.appendChild(tekstSpan);
            container.appendChild(itemDiv);
        });
    }
    function rebuildLegendFromCanvas() {
        gebruikteLegendeItems.clear();
        const defaultKleuren = ['#fff', 'transparent', '#4a536b', '#5c6784', '#e6e6e6', '#f2f2f2', 'darkgray', '', 'black', '#333'];
        const heeftEchteLegendeKleur = item => {
            if (!item || item.nietInkleuren || item.standaardVulling === undefined) return false;
            return !kleurenZijnGelijk(item.fill, item.standaardVulling);
        };
        canvas.forEachObject(obj => {
            const objectType = obj.voorwerpType;
            if (!objectType || obj.isNaam) return;
            const type = normaliseerLegendeType(objectType);
            if (!gebruikteLegendeItems.has(type)) gebruikteLegendeItems.set(type, { kleur: null });
            let kleur = null;
            if (obj.isType('image') && obj.filters && obj.filters.length > 0) {
                const blendFilter = obj.filters.find(f => f.type === 'BlendColor');
                if (blendFilter) kleur = blendFilter.color;
            } else if (obj.voorwerpType === 'deur') {
                const deurSymbol = obj.getObjects && obj.getObjects().find(o => o.type === 'path');
                if (deurSymbol && deurSymbol.stroke && !defaultKleuren.includes(deurSymbol.stroke)) kleur = deurSymbol.stroke;
            } else if (obj.isType('group')) {
                const gekleurdItem = verzamelZichtbareOnderdelen(obj).find(item => {
                    if (item.isType('image') && item.filters && item.filters.length > 0) {
                        return item.filters.some(f => f.type === 'BlendColor');
                    }
                    // Donkere vaste details (bv. kasthandvatten en meubellijnen)
                    // zijn geen legendekleur. Alleen een vulling die werkelijk
                    // afwijkt van de opgeslagen standaardvulling telt mee.
                    return heeftEchteLegendeKleur(item);
                });
                if (gekleurdItem) {
                    if (gekleurdItem.isType('image')) {
                        const blendFilter = gekleurdItem.filters.find(f => f.type === 'BlendColor');
                        if(blendFilter) kleur = blendFilter.color;
                    } else {
                        kleur = gekleurdItem.fill;
                    }
                }
            } else if (heeftEchteLegendeKleur(obj)) {
                kleur = obj.fill;
            }
            if (type === 'muur' || type === 'raam') kleur = null;
            if (kleur) gebruikteLegendeItems.set(type, { kleur });
        });
        updateLegendeWeergave();
    }
    kleurenpalet.addEventListener('click', (e) => {
        if (e.target.classList.contains('kleur-staal')) {
            const vorigActief = kleurenpalet.querySelector('.actief');
            if (vorigActief) vorigActief.classList.remove('actief');
            e.target.classList.add('actief');
            actieveLegendeKleur = e.target.dataset.kleur;
        }
    });
    legendeCategorieKnoppen.forEach(knop => {
        knop.addEventListener('click', () => {
            const vorigeActieve = document.querySelector('#legende-categorieen button.actief');
            if (vorigeActieve) vorigeActieve.classList.remove('actief');
            if (actieveLegendeType === knop.dataset.type) { actieveLegendeType = null; canvas.defaultCursor = 'default'; }
            else { actieveLegendeType = knop.dataset.type; knop.classList.add('actief'); canvas.defaultCursor = 'crosshair'; }
        });
    });
    canvas.on('mouse:down', (o) => {
        if (modus !== 'legende' || !actieveLegendeType || !o.target) return;
        const obj = o.target.group ? o.target.group : o.target;
        const kleur = actieveLegendeKleur;
        let typeMatch = (normaliseerLegendeType(obj.voorwerpType) === actieveLegendeType);
        if (actieveLegendeType === 'schoolbord' && obj.voorwerpType === 'schoolbordFlappen') typeMatch = true;
        if (typeMatch) {
            const kleurItem = (item) => {
                if (!item || item.isNaam || item.nietInkleuren) return;
                if (item.voorwerpType === 'deur' && actieveLegendeType === 'deur') {
                    const deurSymbol = verzamelZichtbareOnderdelen(item).find(o => o.type === 'path');
                    if(deurSymbol) deurSymbol.set('stroke', kleur);
                } else if (item.isType('group')) {
                    item.getObjects().forEach(kleurItem);
                } else if (item.isType('image')) {
                    item.filters = [new fabric.Image.filters.BlendColor({ color: kleur, mode: 'multiply', alpha: 1.0 })];
                    item.applyFilters();
                } else if (item.voorwerpType !== 'muur' && item.voorwerpType !== 'raam') {
                    item.set('fill', kleur);
                }
            };
            if (obj.isType('group')) {
                if (obj.voorwerpType === 'deur' && actieveLegendeType === 'deur') kleurItem(obj);
                else obj.getObjects().forEach(item => kleurItem(item));
            } else kleurItem(obj);
            const type = normaliseerLegendeType(obj.voorwerpType);
            const setKleur = (type === 'muur' || type === 'raam') ? null : kleur;
            gebruikteLegendeItems.set(type, { kleur: setKleur });
            if (!legendeTonenToggle.checked) { setCanvasColorsFromLegend(false); }
            updateLegendeWeergave();
            canvas.renderAll();
            saveStateImmediate();
        } else if (obj.voorwerpType) {
            alert(`Fout! Dit is een '${obj.voorwerpType}'. Je hebt de categorie '${actieveLegendeType}' geselecteerd.`);
        }
    });
    function setNamenZichtbaarheid(zichtbaar) {
        canvas.forEachObject(obj => {
            if (obj.isType('group') && obj.studentNaam) {
                const tekstObject = obj.getObjects().find(item => item.isNaam);
                if (tekstObject) tekstObject.set('visible', zichtbaar);
            } else if (obj.isNaam) obj.set('visible', zichtbaar);
        });
        canvas.renderAll();
    }
    namenTonenToggle.addEventListener('change', (e) => setNamenZichtbaarheid(e.target.checked));
    legendeTonenToggle.addEventListener('change', (e) => {
        setCanvasColorsFromLegend(e.target.checked);
        updateLegendeWeergave();
        planCanvasAanpassing();
    });
    function verwijderSelectie() {
        const sel = canvas.getActiveObjects(); if (!sel || sel.length === 0) return;
        sel.forEach(obj => canvas.remove(obj));
        canvas.discardActiveObject();
        rebuildLegendFromCanvas();
        saveStateImmediate();
        canvas.renderAll();
    }
    verwijderKnop.addEventListener('click', verwijderSelectie);
    function dupliceerSelectie() {
        const obj = canvas.getActiveObject(); if (!obj) return;
        obj.clone((kloon) => {
            canvas.discardActiveObject();
            kloon.set({ left: kloon.left + gridSize, top: kloon.top + gridSize });
            if (kloon.type === 'activeSelection') { kloon.canvas = canvas; kloon.forEachObject(o => canvas.add(o)); kloon.setCoords(); }
            else canvas.add(kloon);
            maakInteractief(kloon); canvas.setActiveObject(kloon); canvas.requestRenderAll();
        }, customProperties);
    }
    dupliceerKnop.addEventListener('click', dupliceerSelectie);
    draaiKwartslagKnop.addEventListener('click', () => {
        const selectie = canvas.getActiveObjects();
        if (!selectie || selectie.length === 0) {
            alert('Selecteer eerst het raam of object dat je wilt draaien.');
            return;
        }
        selectie.forEach(obj => {
            const huidigeHoek = Number(obj.angle) || 0;
            obj.rotate((Math.round(huidigeHoek / 90) * 90 + 90) % 360);
            obj.setCoords();
        });
        canvas.requestRenderAll();
        saveStateImmediate();
    });
    spiegelKnop.addEventListener('click', () => {
        const selectie = canvas.getActiveObjects();
        if (!selectie || selectie.length === 0) {
            alert('Selecteer eerst de deur of het object dat je wilt spiegelen.');
            return;
        }
        selectie.forEach(obj => {
            obj.set('flipX', !obj.flipX);
            obj.setCoords();
        });
        canvas.requestRenderAll();
        saveStateImmediate();
    });
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && bouwTool === 'gom') {
            zetBouwTool('');
            return;
        }
        if (e.key === 'Escape' && workspace.classList.contains('presentatie-weergave')) {
            workspace.classList.remove('presentatie-weergave');
            grootTonenKnop.textContent = '⛶ Groot tonen';
            stelWeergaveZoomIn(zoomVoorPresentatie);
            return;
        }
        const activeEl = document.activeElement;
        if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'SELECT')) return;
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') { e.preventDefault(); dupliceerSelectie(); }
        if (e.key === 'Delete' || e.key === 'Backspace') { verwijderSelectie(); }
    });

    // --- PDF GENERATIE ---
    const iconCache = new Map();
    function svgStringForType(type){
        if (type === 'dubbeleSchoolbank') {
            return `<svg viewBox="0 0 120 65" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="25" width="116" height="36" rx="3" fill="#fff" stroke="#3f4a54" stroke-width="2"/><rect x="18" y="2" width="32" height="17" rx="3" fill="#fff" stroke="#3f4a54" stroke-width="2"/><rect x="70" y="2" width="32" height="17" rx="3" fill="#fff" stroke="#3f4a54" stroke-width="2"/></svg>`;
        } else if (type === 'leerlingBureau') {
            return `<svg viewBox="0 0 60 40" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="56" height="36" fill="none" stroke="#333" stroke-width="2"/><circle cx="45" cy="20" r="6" fill="none" stroke="#333" stroke-width="2"/></svg>`;
        } else if (type === 'tafel') {
            return `<svg viewBox="0 0 80 50" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="76" height="46" fill="none" stroke="#333" stroke-width="2"/></svg>`;
        } else if (type === 'schoolbord' || type === 'schoolbordFlappen') {
            return `<svg viewBox="0 0 120 30" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="10" width="100" height="10" fill="#e6e6e6" stroke="#000" stroke-width="2"/>${type === 'schoolbordFlappen' ? `<rect x="-15" y="10" width="25" height="10" fill="#f2f2f2" stroke="#000" stroke-width="2"/><rect x="110" y="10" width="25" height="10" fill="#f2f2f2" stroke="#000" stroke-width="2"/>` : '' }</svg>`;
        } else if (type === 'muur') {
            return `<svg viewBox="0 0 120 20" xmlns="http://www.w3.org/2000/svg"><line x1="5" y1="10" x2="115" y2="10" stroke="#333" stroke-width="5" /></svg>`;
        } else if (type === 'deur') {
            return `<svg viewBox="0 0 50 45" xmlns="http://www.w3.org/2000/svg"><line x1="5" y1="5" x2="5" y2="40" stroke="#000" stroke-width="2"/><path d="M5 5 Q45 5 45 40" fill="none" stroke="#000" stroke-width="2"/></svg>`;
        } else if (type === 'raam') {
            return `<svg viewBox="0 0 84 16" xmlns="http://www.w3.org/2000/svg"><line x1="4" y1="5" x2="80" y2="5" stroke="#6cace4" stroke-width="2"/><line x1="4" y1="11" x2="80" y2="11" stroke="#6cace4" stroke-width="2"/></svg>`;
        }
        return `<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"></svg>`;
    }
    function loadImage(src){
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = ()=>resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }
    async function iconToDataUrl(type, sizePx=160){
        if (iconCache.has(type)) return iconCache.get(type);
        const pngTypes = ['schoolbank','bureau','kast','wastafel', 'kring'];
        let dataUrl;
        if (pngTypes.includes(type)) {
            const img = await loadImage(`${IMG_PATH}${type}.png`);
            const c = document.createElement('canvas'); c.width = sizePx; c.height = sizePx;
            const ctx = c.getContext('2d');
            const pad = Math.round(sizePx*0.15);
            const inner = sizePx - pad*2;
            ctx.strokeStyle = '#333'; ctx.lineWidth = 2; ctx.strokeRect(pad, pad, inner, inner);
            const max = Math.round(inner*0.8);
            let w = img.width, h = img.height;
            const scale = Math.min(max/w, max/h);
            w = Math.round(w*scale); h = Math.round(h*scale);
            const ix = pad + Math.round((inner - w)/2);
            const iy = pad + Math.round((inner - h)/2);
            ctx.drawImage(img, ix, iy, w, h);
            dataUrl = c.toDataURL('image/png');
        } else {
            const svg = svgStringForType(type);
            const svgBlob = new Blob([svg], {type:'image/svg+xml'});
            const svgUrl = URL.createObjectURL(svgBlob);
            const img = await loadImage(svgUrl);
            const c = document.createElement('canvas'); c.width = sizePx; c.height = sizePx;
            const ctx = c.getContext('2d');
            const pad = Math.round(sizePx*0.15);
            const inner = sizePx - pad*2;
            ctx.strokeStyle = '#333'; ctx.lineWidth = 2; ctx.strokeRect(pad, pad, inner, inner);
            const max = Math.round(inner*0.8);
            const scale = Math.min(max/img.width, max/img.height);
            const w = Math.round(img.width*scale), h = Math.round(img.height*scale);
            const ix = pad + Math.round((inner - w)/2);
            const iy = pad + Math.round((inner - h)/2);
            ctx.drawImage(img, ix, iy, w, h);
            dataUrl = c.toDataURL('image/png');
            URL.revokeObjectURL(svgUrl);
        }
        iconCache.set(type, dataUrl);
        return dataUrl;
    }
    async function genereerPdf(opties) {
        const { toonNamen, toonLegende, toonKleuren } = opties;

        const originalColorState = legendeTonenToggle.checked;
        const originalNameState = namenTonenToggle.checked;
        const wasRasterZichtbaar = gridVisible;

        try {
            setCanvasColorsFromLegend(toonKleuren);
            setNamenZichtbaarheid(toonNamen);
            // Een zichtbaar metrisch raster hoort bij de leeropdracht en blijft daarom ook op de PDF staan.
            
            // BELANGRIJKE FIX: Zorg ervoor dat de legendelijst is bijgewerkt
            // met de staat van het canvas ZOALS HET IN DE PDF ZAL VERSCHIJNEN.
            if (toonKleuren) {
                rebuildLegendFromCanvas();
            }

            const plattegrondDataUrl = canvas.toDataURL({ format: 'png', quality: 1.0 });

            const orientation = canvas.getWidth() > canvas.getHeight() ? 'landscape' : 'portrait';
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({ orientation: orientation, unit: 'mm', format: 'a4' });
            const A4_WIDTH = (orientation === 'landscape') ? 297 : 210;
            const A4_HEIGHT = (orientation === 'landscape') ? 210 : 297;
            const MARGIN = 10;
            const PRINT_WIDTH = A4_WIDTH - (MARGIN * 2);
            const PRINT_HEIGHT = A4_HEIGHT - (MARGIN * 2);
            const plattegrondTitel = `Klaslokaal Plattegrond ${toonNamen ? '(met namen)' : ''}`;
            doc.setFontSize(14);
            doc.text(plattegrondTitel, A4_WIDTH / 2, MARGIN + 2, { align: 'center' });
            const scale = Math.min(PRINT_WIDTH / canvas.getWidth(), PRINT_HEIGHT / canvas.getHeight());
            const scaledWidth = canvas.getWidth() * scale;
            const scaledHeight = canvas.getHeight() * scale;
            const x = MARGIN + (PRINT_WIDTH - scaledWidth) / 2;
            const y = MARGIN + 5 + (PRINT_HEIGHT - 5 - scaledHeight) / 2;
            doc.addImage(plattegrondDataUrl, 'PNG', x, y, scaledWidth, scaledHeight);

            if (toonLegende && gebruikteLegendeItems.size > 0) {
                doc.addPage();
                const items = Array.from(gebruikteLegendeItems.entries()).filter(([type]) => !!legendeNamen[type]);
                const kolommen = items.length > 4 ? 2 : 1;
                const rijen = Math.ceil(items.length / kolommen);
                const rijHoogte = 22;
                const kaartBreedte = Math.min(A4_WIDTH - 30, kolommen === 2 ? 185 : 105);
                const kaartHoogte = 31 + rijen * rijHoogte;
                const kaartX = (A4_WIDTH - kaartBreedte) / 2;
                const kaartY = Math.max(10, (A4_HEIGHT - kaartHoogte) / 2);
                const binnenMarge = 10;
                const kolomTussenruimte = 10;
                const kolomBreedte = (kaartBreedte - binnenMarge * 2 - kolomTussenruimte * (kolommen - 1)) / kolommen;
                const kleurVak = 8;
                const icoonGrootte = 15;

                doc.setFillColor(248, 252, 255);
                doc.setDrawColor(190, 211, 226);
                doc.setLineWidth(0.6);
                doc.roundedRect(kaartX, kaartY, kaartBreedte, kaartHoogte, 4, 4, 'FD');
                doc.setFillColor(228, 242, 251);
                doc.roundedRect(kaartX, kaartY, kaartBreedte, 23, 4, 4, 'F');
                doc.setFillColor(228, 242, 251);
                doc.rect(kaartX, kaartY + 17, kaartBreedte, 6, 'F');
                doc.setDrawColor(190, 211, 226);
                doc.line(kaartX, kaartY + 23, kaartX + kaartBreedte, kaartY + 23);
                doc.setTextColor(23, 59, 97);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(18);
                doc.text('Legende', A4_WIDTH / 2, kaartY + 15, { align: 'center' });

                for (let index = 0; index < items.length; index++) {
                    const [type, waarde] = items[index];
                    const kolom = Math.floor(index / rijen);
                    const rij = index % rijen;
                    const baseX = kaartX + binnenMarge + kolom * (kolomBreedte + kolomTussenruimte);
                    const centerY = kaartY + 27 + rij * rijHoogte + rijHoogte / 2;

                    const kleur = (waarde && waarde.kleur && type !== 'muur' && type !== 'raam') ? waarde.kleur : null;
                    if (kleur) {
                        const [r, g, b] = kleurNaarRgba(kleur) || [255, 255, 255];
                        doc.setFillColor(r,g,b);
                        doc.setDrawColor(110, 127, 140);
                        doc.roundedRect(baseX, centerY - kleurVak / 2, kleurVak, kleurVak, 1, 1, 'FD');
                    } else {
                        doc.setFillColor(255, 255, 255);
                        doc.setDrawColor(205, 217, 226);
                        doc.roundedRect(baseX, centerY - kleurVak / 2, kleurVak, kleurVak, 1, 1, 'FD');
                    }

                    const iconX = baseX + kleurVak + 4;
                    const iconY = centerY - icoonGrootte / 2;
                    const iconDataUrl = await iconToDataUrl(type, 160);
                    doc.addImage(iconDataUrl, 'PNG', iconX, iconY, icoonGrootte, icoonGrootte);

                    const textX = iconX + icoonGrootte + 4;
                    const textY = centerY + 1.8;
                    doc.setTextColor(32, 59, 87);
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(11);
                    doc.text(legendeNamen[type] || type, textX, textY);
                }
            }
            doc.save(`plattegrond${toonLegende ? '_met_legende' : (toonNamen ? '_met_namen' : '')}.pdf`);

        } catch (error) {
            console.error("Er is een fout opgetreden bij het genereren van de PDF:", error);
            alert("Er is een onverwachte fout opgetreden bij het maken van de PDF. Controleer de console voor meer details.");
        } finally {
            // Herstel ALTIJD de originele visuele staat van het canvas
            setCanvasColorsFromLegend(originalColorState);
            setNamenZichtbaarheid(originalNameState);
            if (wasRasterZichtbaar) {
                tekenRaster();
            }
            rebuildLegendFromCanvas();
        }
    }

    // --- PDF knoppen ---
    document.getElementById('downloadPdfPlattegrondKnop').addEventListener('click', () => {
        genereerPdf({ toonNamen: false, toonLegende: false, toonKleuren: false });
    });
    document.getElementById('downloadPdfNamenKnop').addEventListener('click', () => {
        genereerPdf({ toonNamen: true, toonLegende: false, toonKleuren: false });
    });
    document.getElementById('downloadPdfLegendeKnop').addEventListener('click', () => {
        genereerPdf({ toonNamen: false, toonLegende: true, toonKleuren: true });
    });

    laadCanvasUitBrowser();
    requestAnimationFrame(() => requestAnimationFrame(pasCanvasInWerkruimte));
});

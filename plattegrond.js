document.addEventListener('DOMContentLoaded', () => {
    const canvasEl = document.getElementById('canvas');
    const canvas = new fabric.Canvas(canvasEl, {
        backgroundColor: '#fff',
        preserveObjectStacking: true
    });

    // --- VARIABELEN & STATUS ---
    let modus = 'meubel';
    let isWisselModusActief = false;
    let bouwTool = '';
    let isDrawingWall = false;
    let wallStartPoint;
    let gridVisible = false;
    let gridGroup = new fabric.Group([], { selectable: false, evented: false, excludeFromExport: true });
    const gridSize = 20;
    let actieveLegendeType = null;
    let actieveLegendeKleur = '#FFEB3B'; // Start met geel
    let gebruikteLegendeItems = new Map();
    let history = [];
    let redoStack = [];
    let isUpdatingState = false;
    const IMG_PATH = 'plattegrond_afbeeldingen/';
    const customProperties = ['studentNaam', 'voorwerpType', 'isNaam', 'gekoppeldAan'];

    // --- UI ELEMENTEN ---
    const formaatWisselKnop = document.getElementById('formaatWisselKnop');
    const undoKnop = document.getElementById('undoKnop');
    const redoKnop = document.getElementById('redoKnop');
    const verwijderKnop = document.getElementById('verwijderKnop');
    const dupliceerKnop = document.getElementById('dupliceerKnop');
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
    const rasterToggle = document.getElementById('rasterToggle');
    const namenTonenToggle = document.getElementById('namenTonenToggle');
    const namenWachtlijstContainer = document.getElementById('namen-wachtlijst-container');
    const namenLijst = document.getElementById('namen-lijst');
    const kleurenpalet = document.getElementById('kleurenpalet');

    // --- FORMAAT WISSELEN LOGICA ---
    function wisselCanvasFormaat() {
        const wasRasterZichtbaar = gridVisible;
        const json = canvas.toJSON(customProperties);
        
        const oldWidth = canvas.getWidth();
        const oldHeight = canvas.getHeight();

        // Wissel de dimensies in de HTML en op de canvas
        canvas.setWidth(oldHeight);
        canvas.setHeight(oldWidth);
        canvasEl.width = oldHeight;
        canvasEl.height = oldWidth;

        // Laad de objecten terug
        canvas.loadFromJSON(json, () => {
            canvas.renderAll();
            // Herteken het raster indien nodig
            if (wasRasterZichtbaar) {
                tekenRaster();
            }
        });
        
        // Sla de nieuwe staat op
        setTimeout(saveStateImmediate, 200);
    }
    formaatWisselKnop.addEventListener('click', wisselCanvasFormaat);


    // --- PERFORMANCE HELPER: DEBOUNCE ---
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => { clearTimeout(timeout); func(...args); };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // --- AUTOMATISCH OPSLAAN & HERLADEN ---
    function slaCanvasOpInBrowser() {
        if (isUpdatingState) return;
        try {
            const json = JSON.stringify(canvas.toJSON(customProperties));
            localStorage.setItem('plattegrondData', json);
        } catch (e) {
            if (e.name === 'QuotaExceededError') {
                console.error("LocalStorage quota overschreden. Automatisch opslaan is uitgeschakeld.");
                if (!window.quotaExceededNotified) {
                    alert("De plattegrond is te groot geworden voor automatisch opslaan in de browser. Exporteer je werk handmatig om verlies te voorkomen.");
                    window.quotaExceededNotified = true;
                }
            } else {
                console.error("Kon niet opslaan naar localStorage:", e);
            }
        }
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
        canvas.remove(gridGroup);
        rebuildLegendFromCanvas(); 
        
        canvas.renderAll();

        localStorage.removeItem('plattegrondData');
        const emptyState = JSON.stringify(canvas.toJSON(customProperties));
        history = [emptyState];
        redoStack = [];
        updateUndoRedoButtons();
    }
    nieuwKnop.addEventListener('click', () => startNieuweTekening(true));

    // --- UNDO / REDO LOGICA ---
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

    // --- IMPORTEER / EXPORTEER LOGICA ---
    function laadJsonData(jsonData, isUndoRedo = false) {
        isUpdatingState = true;
        
        canvas.clear();
        
        rasterToggle.checked = false;
        gridVisible = false;

        const data = JSON.parse(jsonData);
        // Zet de canvasgrootte op basis van het geladen bestand
        if (data.width && data.height) {
            canvas.setWidth(data.width);
            canvas.setHeight(data.height);
        }

        canvas.loadFromJSON(jsonData, () => {
            const objectsToRemove = [];
            canvas.forEachObject(obj => {
                if (obj.type === 'line' && obj.stroke === '#ddd' && obj.selectable === false && obj.evented === false) {
                    objectsToRemove.push(obj);
                }
                if (obj.type === 'group' && obj.getObjects().length > 10 && obj.getObjects()[0].stroke === '#ddd') {
                     objectsToRemove.push(obj);
                }
            });
            
            if (objectsToRemove.length > 0) {
                console.log(`Automatische schoonmaak: ${objectsToRemove.length} oude rasterobjecten verwijderd.`);
                objectsToRemove.forEach(obj => canvas.remove(obj));
            }

            isUpdatingState = false;
            if (!isUndoRedo) {
                history = [typeof jsonData === 'string' ? jsonData : JSON.stringify(jsonData)];
                redoStack = [];
                slaCanvasOpInBrowser(); 
                updateUndoRedoButtons();
            }
            schakelModus('meubel', true);
            setNamenZichtbaarheid(namenTonenToggle.checked);
            rebuildLegendFromCanvas();
            
            canvas.renderAll();
        });
    }

    exporteerJsonKnop.addEventListener('click', () => {
        // Voeg de canvas dimensies toe aan de export
        const json = canvas.toJSON(customProperties);
        json.width = canvas.getWidth();
        json.height = canvas.getHeight();

        const blob = new Blob([JSON.stringify(json)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'klasplattegrond.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    importeerJsonKnop.addEventListener('click', () => { jsonFileInput.click(); });
    jsonFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = event.target.result;
                laadJsonData(json);
            } catch (err) {
                console.error("Specifieke import fout:", err);
                alert("Fout bij het importeren. Is dit een geldig plattegrond-bestand?");
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    });
    
    // --- WISSELMODUS LOGICA ---
    // (Deze sectie blijft ongewijzigd)

    // ... (volledige wisselmodus logica hier plakken) ...
    function startPlaatsenWisselen() {
        const groepen = canvas.getObjects().filter(obj => obj.studentNaam);
        if (groepen.length === 0) {
            alert("Er zijn geen namen op de plattegrond om te wisselen.");
            return;
        }

        isWisselModusActief = true;
        schakelModus('wissel');
        modusKnoppen.wissel.textContent = 'Klaar';

        let clonesDone = 0;
        const clonedMeubels = [];
        const namenVoorWachtruimte = [];

        groepen.forEach(groep => {
            const meubel = groep.getObjects().find(item => !item.isNaam);
            const naam = groep.studentNaam;

            if (meubel) {
                meubel.clone(kloon => {
                    kloon.set({
                        left: groep.getCenterPoint().x, top: groep.getCenterPoint().y,
                        angle: groep.angle, originX: 'center', originY: 'center',
                        selectable: false, evented: false
                    });
                    clonedMeubels.push(kloon);
                    namenVoorWachtruimte.push(naam);
                    
                    clonesDone++;
                    if (clonesDone === groepen.length) {
                        groepen.forEach(g => canvas.remove(g));
                        clonedMeubels.forEach(m => canvas.add(m));

                        namenLijst.innerHTML = '';
                        namenVoorWachtruimte.forEach(n => {
                            const schoneNaam = n.trim();
                            const naamItem = document.createElement('div');
                            naamItem.className = 'naam-item';
                            naamItem.draggable = true;
                            naamItem.textContent = schoneNaam;
                            naamItem.dataset.naam = schoneNaam;
                            namenLijst.appendChild(naamItem);
                        });
                        namenWachtlijstContainer.classList.remove('verborgen');
                        
                        canvas.renderAll();
                    }
                }, customProperties);
            } else {
                clonesDone++;
                if (clonesDone === groepen.length) {
                    groepen.forEach(g => canvas.remove(g));
                    canvas.renderAll();
                }
            }
        });
        
        namenLijst.addEventListener('dragstart', handleDragStart);
        canvas.upperCanvasEl.addEventListener('dragover', handleDragOver);
        canvas.upperCanvasEl.addEventListener('drop', handleDrop);
    }

    function stopPlaatsenWisselen() {
        if (namenLijst.children.length > 0) {
             if (!confirm("Er staan nog namen in de wachtruimte. Weet je zeker dat je wilt stoppen? Niet-geplaatste namen worden verwijderd.")) return;
        }
        isWisselModusActief = false;
        modusKnoppen.wissel.textContent = 'Plaatsen Wisselen';

        namenWachtlijstContainer.classList.add('verborgen');
        namenLijst.innerHTML = '';

        namenLijst.removeEventListener('dragstart', handleDragStart);
        canvas.upperCanvasEl.removeEventListener('dragover', handleDragOver);
        canvas.upperCanvasEl.removeEventListener('drop', handleDrop);

        let teVerwijderen = [];
        let teGroeperen = new Map();

        canvas.forEachObject(obj => {
            if (obj.isNaam) {
                const meubel = canvas.getObjects().find(m => m.gekoppeldAan === obj.studentNaam);
                if (meubel) {
                    teGroeperen.set(obj.studentNaam, { naamObj: obj, meubelObj: meubel });
                } else {
                    teVerwijderen.push(obj);
                }
            }
        });

        teGroeperen.forEach(({ naamObj, meubelObj }) => {
            groepeerNaamMetObject(naamObj.studentNaam, meubelObj);
            teVerwijderen.push(naamObj, meubelObj);
        });
        
        teVerwijderen.forEach(obj => canvas.remove(obj));
        
        canvas.forEachObject(obj => {
            if(obj.voorwerpType) obj.set({ gekkoppeldAan: null });
            obj.set({ selectable: true, evented: true });
        });

        schakelModus('meubel');
        saveStateImmediate();
    }

    function handleDragStart(e) {
        e.dataTransfer.setData('text/plain', e.target.dataset.naam);
        e.dataTransfer.effectAllowed = 'move';
    }

    function handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }

    function handleDrop(e) {
        e.preventDefault();
        const naam = e.dataTransfer.getData('text/plain').trim();
        if (!naam) return;

        const pointer = canvas.getPointer(e);
        const meubels = canvas.getObjects().filter(obj => obj.voorwerpType && !obj.isNaam);
        const doelMeubel = meubels.reverse().find(m => m.containsPoint(pointer));

        if (doelMeubel) {
            const zittendeNaam = doelMeubel.gekoppeldAan;

            if (zittendeNaam && zittendeNaam !== naam) {
                const zittendeNaamObject = canvas.getObjects().find(o => o.isNaam && o.studentNaam === zittendeNaam);
                if (zittendeNaamObject) canvas.remove(zittendeNaamObject);
                
                doelMeubel.set('gekoppeldAan', null);

                const naamItem = document.createElement('div');
                naamItem.className = 'naam-item';
                naamItem.draggable = true;
                naamItem.textContent = zittendeNaam;
                naamItem.dataset.naam = zittendeNaam;
                namenLijst.appendChild(naamItem);
            }
            
            const gesleepteNaamElement = Array.from(namenLijst.children).find(el => el.dataset.naam === naam);
            if (gesleepteNaamElement) gesleepteNaamElement.remove();

            const alGeplaatsteNaam = canvas.getObjects().find(obj => obj.studentNaam === naam && obj.isNaam);
            if (alGeplaatsteNaam) {
                canvas.remove(alGeplaatsteNaam);
            }

            const tekst = new fabric.IText(naam, {
                left: doelMeubel.getCenterPoint().x, top: doelMeubel.getCenterPoint().y,
                fontSize: 16, fontFamily: 'Arial', originX: 'center', originY: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.9)', padding: 4,
                studentNaam: naam, isNaam: true, selectable: true
            });
            doelMeubel.set('gekoppeldAan', naam);
            canvas.add(tekst);
            canvas.renderAll();
        }
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
            } 
            else if (vorigMeubel) {
                vorigMeubel.set('gekoppeldAan', null);
            }

            naamObject.set({ left: doelMeubel.getCenterPoint().x, top: doelMeubel.getCenterPoint().y });
            doelMeubel.set('gekoppeldAan', naamObject.studentNaam);
        } 
        else if (!doelMeubel && vorigMeubel) {
            vorigMeubel.set('gekoppeldAan', null);
        }
        else if (vorigMeubel) {
            naamObject.set({ left: vorigMeubel.getCenterPoint().x, top: vorigMeubel.getCenterPoint().y });
        }

        naamObject.setCoords();
        canvas.requestRenderAll();
    });


    // --- MODUS SWITCHER ---
    function schakelModus(nieuweModus) {
        modus = nieuweModus;
        canvas.isDrawingMode = false;

        Object.values(modusKnoppen).forEach(knop => knop.classList.remove('actief'));
        if (modusKnoppen[nieuweModus]) modusKnoppen[nieuweModus].classList.add('actief');
        Object.values(werkbalken).forEach(balk => balk.classList.add('verborgen'));
        if (werkbalken[nieuweModus]) werkbalken[nieuweModus].classList.remove('verborgen');
        legendeContainer.classList.toggle('verborgen', nieuweModus !== 'legende');
        
        const isInteractief = !['legende', 'wissel'].includes(nieuweModus);
        canvas.selection = isInteractief;
        canvas.defaultCursor = 'default';

        canvas.forEachObject(obj => {
            if (nieuweModus === 'wissel') {
                obj.set({ selectable: obj.isNaam });
            } else {
                obj.set({ selectable: isInteractief });
            }
            if (obj.voorwerpType === 'muur') obj.set({ evented: (modus === 'bouw') });
        });
        canvas.renderAll();
    }

    Object.keys(modusKnoppen).forEach(key => {
        if(key !== 'wissel') {
            modusKnoppen[key].addEventListener('click', () => schakelModus(key));
        } else {
            modusKnoppen[key].addEventListener('click', () => {
                if (isWisselModusActief) { stopPlaatsenWisselen(); } else { startPlaatsenWisselen(); }
            });
        }
    });

    // --- RASTER & BOUWMODUS ---
    // (Deze sectie blijft ongewijzigd)

    // ... (volledige raster & bouwmodus logica hier plakken) ...
    function tekenRaster() {
        canvas.remove(gridGroup);
        const width = canvas.getWidth(), height = canvas.getHeight();
        const lines = [];
        const lineOptions = { stroke: '#ddd', selectable: false, evented: false, excludeFromExport: true };
        for (let i = 0; i < (width / gridSize); i++) { lines.push(new fabric.Line([i * gridSize, 0, i * gridSize, height], lineOptions)); }
        for (let i = 0; i < (height / gridSize); i++) { lines.push(new fabric.Line([0, i * gridSize, width, i * gridSize], lineOptions)); }
        gridGroup = new fabric.Group(lines, { selectable: false, evented: false, excludeFromExport: true });
        canvas.add(gridGroup);
        gridGroup.moveTo(0);
        canvas.renderAll();
    }
    rasterToggle.addEventListener('change', (e) => {
        gridVisible = e.target.checked;
        if (gridVisible) {
            tekenRaster();
        } else {
            canvas.remove(gridGroup);
            canvas.renderAll();
        }
    });

    function zetBouwTool(nieuweTool) {
        bouwTool = nieuweTool;
        canvas.isDrawingMode = (bouwTool === 'gom');
    }

    document.getElementById('tekenMuurKnop').addEventListener('click', () => zetBouwTool('muur'));
    document.getElementById('plaatsDeurKnop').addEventListener('click', () => {
        zetBouwTool('deur');
        const deurSymbol = new fabric.Path('M 0 0 L 0 40 M 0 0 Q 40 0 40 40', { fill: '', stroke: 'black', strokeWidth: 2 });
        const achtergrond = new fabric.Rect({ width: 42, height: 8, fill: canvas.backgroundColor, originX: 'center', originY: 'center'});
        const deur = new fabric.Group([achtergrond, deurSymbol], { left: 50, top: 50, voorwerpType: 'deur', originX: 'left', originY: 'bottom' });
        canvas.add(deur);
        canvas.setActiveObject(deur);
        canvas.renderAll();
    });
    document.getElementById('plaatsRaamKnop').addEventListener('click', () => {
        zetBouwTool('raam');
        const raamAchtergrond = new fabric.Rect({ left: 0, top: 0, width: 80, height: 8, fill: canvas.backgroundColor, stroke: 'black', strokeWidth: 1 });
        const glas = new fabric.Line([5, 4, 75, 4], { stroke: '#6cace4', strokeWidth: 2 });
        const raam = new fabric.Group([raamAchtergrond, glas], { left: 50, top: 100, voorwerpType: 'raam' });
        canvas.add(raam);
        canvas.setActiveObject(raam);
        canvas.renderAll();
    });
    document.getElementById('plaatsGomKnop').addEventListener('click', () => {
        zetBouwTool('gom');
        canvas.freeDrawingBrush.color = canvas.backgroundColor;
        canvas.freeDrawingBrush.width = 10;
        canvas.freeDrawingCursor = 'square';
    });
    document.getElementById('plaatsPaalKnop').addEventListener('click', () => {
        zetBouwTool('paal');
        const paal = new fabric.Rect({ left: 100, top: 100, width: gridSize, height: gridSize, fill: 'darkgray', voorwerpType: 'paal' });
        canvas.add(paal);
        canvas.setActiveObject(paal);
        canvas.renderAll();
    });

    canvas.on('mouse:down', (o) => {
        if (modus === 'bouw' && bouwTool === 'muur' && !isDrawingWall) {
             isDrawingWall = true;
             const pointer = canvas.getPointer(o.e);
             wallStartPoint = { x: Math.round(pointer.x / gridSize) * gridSize, y: Math.round(pointer.y / gridSize) * gridSize };
        }
    });
    canvas.on('mouse:up', (o) => {
        if (!isDrawingWall) return;
        isDrawingWall = false;
        const pointer = canvas.getPointer(o.e);
        let endX = Math.round(pointer.x / gridSize) * gridSize;
        let endY = Math.round(pointer.y / gridSize) * gridSize;

        if (o.e.shiftKey) {
            const dx = Math.abs(endX - wallStartPoint.x);
            const dy = Math.abs(endY - wallStartPoint.y);
            if (dx > dy) {
                endY = wallStartPoint.y;
            } else {
                endX = wallStartPoint.x;
            }
        }
        const muur = new fabric.Line([wallStartPoint.x, wallStartPoint.y, endX, endY], { stroke: '#333', strokeWidth: 8, voorwerpType: 'muur', selectable: true, evented: true });
        canvas.add(muur);
        canvas.renderAll();
    });
    

    // --- MEUBELMODUS LOGICA ---
    // (Deze sectie blijft ongewijzigd)

    // ... (volledige meubelmodus logica hier plakken) ...
    werkbalken.meubel.addEventListener('click', (e) => {
        if (e.target.tagName !== 'BUTTON') return;
        const type = e.target.dataset.type;

        const renderCallback = (obj) => {
            canvas.add(obj);
            canvas.setActiveObject(obj);
            canvas.renderAll();
        };

        if (['schoolbank', 'bureau', 'kast', 'wastafel'].includes(type)) {
            fabric.Image.fromURL(`${IMG_PATH}${type}.png`, (img) => {
                img.set({ left: 100, top: 100, voorwerpType: type });
                img.scaleToWidth(80);
                renderCallback(img);
            }, { crossOrigin: 'Anonymous' });
        } else if (type === 'leerlingBureau') {
            const bureauRect = new fabric.Rect({ width: 60, height: 40, fill: 'transparent', stroke: '#333', strokeWidth: 1, originX: 'center', originY: 'center' });
            const stoelCirkel = new fabric.Circle({ radius: 8, fill: 'transparent', stroke: '#333', strokeWidth: 1, left: 20, top: -10, originX: 'center', originY: 'center' });
            const leerlingBureauGroep = new fabric.Group([bureauRect, stoelCirkel], { left: 100, top: 100, voorwerpType: 'leerlingBureau' });
            renderCallback(leerlingBureauGroep);
        } else if (type === 'tafel') {
            const tafel = new fabric.Rect({ left: 100, top: 100, width: 80, height: 50, fill: 'transparent', stroke: '#333', strokeWidth: 1, voorwerpType: 'tafel' });
            renderCallback(tafel);
        } else if (type === 'schoolbord') {
            const bord = new fabric.Rect({ left: 150, top: 50, width: 150, height: 10, fill: '#4a536b', stroke: 'black', strokeWidth: 2, voorwerpType: 'schoolbord' });
            renderCallback(bord);
        } else if (type === 'schoolbordFlappen') {
             const midden = new fabric.Rect({ width: 100, height: 10, fill: '#4a536b', stroke: 'black', strokeWidth: 2 });
             const flapL = new fabric.Rect({ width: 50, height: 10, fill: '#5c6784', stroke: 'black', strokeWidth: 2, left: -50 });
             const flapR = new fabric.Rect({ width: 50, height: 10, fill: '#5c6784', stroke: 'black', strokeWidth: 2, left: 100 });
             const bordMetFlappen = new fabric.Group([midden, flapL, flapR], { left: 200, top: 100, voorwerpType: 'schoolbordFlappen' });
             renderCallback(bordMetFlappen);
        }
    });


    // --- NAMENMODUS LOGICA ---
    // (Deze sectie blijft ongewijzigd)

    // ... (volledige namenmodus logica hier plakken) ...
    function groepeerNaamMetObject(naam, object) {
        const objAngle = object.angle || 0;
        const tekst = new fabric.IText(naam, {
            fontSize: 16, fontFamily: 'Arial', originX: 'center', originY: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.9)', padding: 4,
            angle: -objAngle, selectable: true, isNaam: true,
        });
        const objPos = object.getCenterPoint();
        const objVoorwerpType = object.voorwerpType;
        object.set({ originX: 'center', originY: 'center', top: 0, left: 0, angle: 0 });
        const groep = new fabric.Group([object, tekst], {
            left: objPos.x, top: objPos.y, angle: objAngle,
            originX: 'center', originY: 'center',
            voorwerpType: objVoorwerpType, studentNaam: naam,
            subTargetCheck: true
        });
        canvas.add(groep);
    }
    document.getElementById('naamToevoegenKnop').addEventListener('click', () => {
        const naamInput = document.getElementById('naamInput');
        const naam = naamInput.value.trim();
        const actieveObject = canvas.getActiveObject();
        if (!actieveObject || !naam || actieveObject.studentNaam) return;
        const origineelObject = actieveObject;
        groepeerNaamMetObject(naam, origineelObject);
        canvas.remove(origineelObject);
        naamInput.value = '';
        canvas.renderAll();
    });


    // --- LEGENDE MODUS & WEERGAVE LOGICA ---
    // (Deze sectie blijft ongewijzigd)

    // ... (volledige legende logica hier plakken) ...
    function updateLegendeWeergave() {
        const container = document.getElementById('legende-weergave-container');
        const wrapper = document.getElementById('legende-weergave-wrapper');
        container.innerHTML = ''; 

        if (gebruikteLegendeItems.size === 0) {
            wrapper.classList.add('verborgen');
            return;
        }
        wrapper.classList.remove('verborgen');

        gebruikteLegendeItems.forEach((kleur, type) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'legende-weergave-item';

            const kleurDiv = document.createElement('div');
            kleurDiv.className = 'legende-weergave-kleur';
            kleurDiv.style.backgroundColor = kleur;

            const tekstSpan = document.createElement('span');
            tekstSpan.className = 'legende-weergave-tekst';
            const prettyType = type.replace(/([A-Z])/g, ' $1').toLowerCase();
            tekstSpan.textContent = prettyType;

            itemDiv.appendChild(kleurDiv);
            itemDiv.appendChild(tekstSpan);
            container.appendChild(itemDiv);
        });
    }

    function rebuildLegendFromCanvas() {
        gebruikteLegendeItems.clear();
        const defaultKleuren = ['#fff', 'transparent', '#4a536b', '#5c6784', 'darkgray', '', 'black'];

        canvas.forEachObject(obj => {
            const type = obj.voorwerpType;
            if (!type || obj.isNaam) return;

            let kleur = null;
            if (obj.isType('image') && obj.filters && obj.filters.length > 0) {
                const blendFilter = obj.filters.find(f => f.type === 'BlendColor');
                if (blendFilter) kleur = blendFilter.color;
            } else if (obj.voorwerpType === 'deur') {
                const deurSymbol = obj.getObjects().find(o => o.type === 'path');
                if (deurSymbol && !defaultKleuren.includes(deurSymbol.stroke)) {
                    kleur = deurSymbol.stroke;
                }
            } else if (obj.isType('group')) {
                const gekleurdItem = obj.getObjects().find(item => item.fill && !defaultKleuren.includes(item.fill));
                if (gekleurdItem) kleur = gekleurdItem.fill;
            } else if (obj.fill && !defaultKleuren.includes(obj.fill)) {
                kleur = obj.fill;
            }

            if (kleur) {
                gebruikteLegendeItems.set(type, kleur);
            }
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
            if (actieveLegendeType === knop.dataset.type) {
                actieveLegendeType = null;
                canvas.defaultCursor = 'default';
            } else {
                actieveLegendeType = knop.dataset.type;
                knop.classList.add('actief');
                canvas.defaultCursor = 'crosshair';
            }
        });
    });

    canvas.on('mouse:down', (o) => {
        if (modus !== 'legende' || !actieveLegendeType || !o.target) return;
        
        const obj = o.target.group ? o.target.group : o.target;
        const kleur = actieveLegendeKleur;

        let typeMatch = (obj.voorwerpType === actieveLegendeType);
        if (actieveLegendeType === 'schoolbord' && obj.voorwerpType === 'schoolbordFlappen') {
            typeMatch = true;
        }

        if (typeMatch) {
            const kleurItem = (item) => {
                if (!item || item.isNaam) return;

                if (item.isType('image')) {
                    item.filters = [];
                    const filter = new fabric.Image.filters.BlendColor({
                        color: kleur, mode: 'multiply', alpha: 1.0
                    });
                    item.filters.push(filter);
                    item.applyFilters();
                } else if (item.voorwerpType === 'deur' && actieveLegendeType === 'deur') {
                    const deurSymbol = item.getObjects().find(o => o.type === 'path');
                    if(deurSymbol) {
                        deurSymbol.set('stroke', kleur);
                    }
                } else {
                    item.set('fill', kleur);
                }
            };

            if (obj.isType('group')) {
                if (obj.voorwerpType === 'deur' && actieveLegendeType === 'deur') {
                    kleurItem(obj);
                } else {
                    obj.getObjects().forEach(item => kleurItem(item));
                }
            } else {
                kleurItem(obj);
            }
            
            gebruikteLegendeItems.set(obj.voorwerpType, kleur);
            updateLegendeWeergave();

            canvas.renderAll();
            saveStateImmediate();

        } else if (obj.voorwerpType) {
            alert(`Fout! Dit is een '${obj.voorwerpType}'. Je hebt de categorie '${actieveLegendeType}' geselecteerd.`);
        }
    });


    // --- ALGEMENE FUNCTIES ---
    // (Deze sectie blijft ongewijzigd)

    // ... (volledige algemene functies logica hier plakken) ...
    function setNamenZichtbaarheid(zichtbaar) {
        canvas.forEachObject(obj => {
            if (obj.isType('group') && obj.studentNaam) {
                const tekstObject = obj.getObjects().find(item => item.isNaam);
                if (tekstObject) {
                    tekstObject.set('visible', zichtbaar);
                }
            }
            else if (obj.isNaam) {
                obj.set('visible', zichtbaar);
            }
        });
        canvas.renderAll();
    }
    namenTonenToggle.addEventListener('change', (e) => { setNamenZichtbaarheid(e.target.checked); });
    
    function verwijderSelectie() {
        const actieveObjecten = canvas.getActiveObjects();
        if (!actieveObjecten || actieveObjecten.length === 0) return;
        
        actieveObjecten.forEach(obj => canvas.remove(obj));
        
        canvas.discardActiveObject();
        
        saveStateImmediate();
        
        rebuildLegendFromCanvas();
        
        canvas.renderAll();
    }
    verwijderKnop.addEventListener('click', verwijderSelectie);

    function dupliceerSelectie() {
        const actieveObject = canvas.getActiveObject();
        if (!actieveObject) return;
    
        actieveObject.clone((kloon) => {
            canvas.discardActiveObject();
            kloon.set({
                left: kloon.left + gridSize,
                top: kloon.top + gridSize,
            });
            if (kloon.type === 'activeSelection') {
                kloon.canvas = canvas;
                kloon.forEachObject(obj => canvas.add(obj));
                kloon.setCoords();
            } else {
                canvas.add(kloon);
            }
            canvas.setActiveObject(kloon);
            canvas.requestRenderAll();
        }, customProperties);
    }
    dupliceerKnop.addEventListener('click', dupliceerSelectie);

    window.addEventListener('keydown', (e) => {
        const activeEl = document.activeElement;
        if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'SELECT')) return;
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') { e.preventDefault(); dupliceerSelectie(); }
        if (e.key === 'Delete' || e.key === 'Backspace') { verwijderSelectie(); }
    });


    // --- PDF GENERATIE ---
    async function genereerPdf(opties) {
        const { toonNamen, toonLegende } = opties;
        const huidigeNamenZichtbaarheid = namenTonenToggle.checked;
        
        const wasRasterZichtbaar = gridVisible;
        if (wasRasterZichtbaar) {
            canvas.remove(gridGroup);
            canvas.renderAll();
        }

        setNamenZichtbaarheid(toonNamen);
        const plattegrondDataUrl = canvas.toDataURL({ format: 'png', quality: 1.0 });
        setNamenZichtbaarheid(huidigeNamenZichtbaarheid);

        if (wasRasterZichtbaar) {
            canvas.add(gridGroup);
            gridGroup.moveTo(0);
            canvas.renderAll();
        }
        
        // AANGEPAST: PDF-oriëntatie past zich aan aan het canvasformaat.
        const orientation = canvas.getWidth() > canvas.getHeight() ? 'landscape' : 'portrait';
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: orientation, unit: 'mm', format: 'a4' });
        
        const A4_WIDTH = (orientation === 'landscape') ? 297 : 210;
        const A4_HEIGHT = (orientation === 'landscape') ? 210 : 297;
        const MARGIN = 10;
        const PRINT_WIDTH = A4_WIDTH - (MARGIN * 2);
        const PRINT_HEIGHT = A4_HEIGHT - (MARGIN * 2);

        const plattegrondTitel = `Klaslokaal Plattegrond ${toonNamen ? '(met namen)' : ''}`;
        doc.text(plattegrondTitel, A4_WIDTH / 2, MARGIN + 2, { align: 'center' });
        
        const scale = Math.min(PRINT_WIDTH / canvas.getWidth(), PRINT_HEIGHT / canvas.getHeight());
        const scaledWidth = canvas.getWidth() * scale;
        const scaledHeight = canvas.getHeight() * scale;
        const x = MARGIN + (PRINT_WIDTH - scaledWidth) / 2;
        const y = MARGIN + 5 + (PRINT_HEIGHT - 5 - scaledHeight) / 2;
        doc.addImage(plattegrondDataUrl, 'PNG', x, y, scaledWidth, scaledHeight);

        if (toonLegende && gebruikteLegendeItems.size > 0) {
            doc.addPage();
            const legendeWrapper = document.getElementById('legende-weergave-wrapper');
            
            const legendeCanvas = await html2canvas(legendeWrapper);
            const legendeDataUrl = legendeCanvas.toDataURL('image/png');

            doc.text("Legende", A4_WIDTH / 2, MARGIN + 2, { align: 'center' });
            const legendeScale = PRINT_WIDTH / legendeCanvas.width;
            const legendeWidth = PRINT_WIDTH;
            const legendeHeight = legendeCanvas.height * legendeScale;
            doc.addImage(legendeDataUrl, 'PNG', MARGIN, MARGIN + 5, legendeWidth, legendeHeight);
        }

        let bestandsnaam = 'klasplattegrond';
        if (toonNamen) bestandsnaam += '-namen';
        if (toonLegende && gebruikteLegendeItems.size > 0) bestandsnaam += '-legende';
        doc.save(`${bestandsnaam}.pdf`);
    }

    document.getElementById('downloadPdfPlattegrondKnop').addEventListener('click', () => {
        genereerPdf({ toonNamen: false, toonLegende: false });
    });
    document.getElementById('downloadPdfNamenKnop').addEventListener('click', () => {
        genereerPdf({ toonNamen: true, toonLegende: false });
    });
    document.getElementById('downloadPdfLegendeKnop').addEventListener('click', () => {
        genereerPdf({ toonNamen: true, toonLegende: true });
    });

    laadCanvasUitBrowser();
});
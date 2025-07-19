document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENTEN KOPPELEN ---
    const uploadBtn = document.getElementById('uploadImageBtn');
    const fileInput = document.getElementById('fileInput');
    const downloadPngBtn = document.getElementById('downloadPngBtn');
    const downloadPdfBtn = document.getElementById('downloadPdfBtn');
    const undoBtn = document.getElementById('undoBtn');
    const opnieuwBtn = document.getElementById('opnieuwBtn');

    const canvasOrigineel = document.getElementById('canvasOrigineel');
    const ctxOrigineel = canvasOrigineel.getContext('2d');
    const canvasVerschillen = document.getElementById('canvasVerschillen');
    const ctxVerschillen = canvasVerschillen.getContext('2d');

    const statusText = document.getElementById('status-text');

    // Tools
    const toolButtons = document.querySelectorAll('.tool-btn');
    const selectionToolsDiv = document.getElementById('selection-tools');
    const pasteBtn = document.getElementById('pasteBtn');
    const dikteInput = document.getElementById('dikte');
    const gumvormSelect = document.getElementById('gumvorm');
    const gumSettingsDiv = document.getElementById('gum-settings');

    // Modal voor bewerken
    const editModalOverlay = document.getElementById('edit-modal-overlay');
    const editCanvas = document.getElementById('editCanvas');
    const ctxEdit = editCanvas.getContext('2d');
    const saveEditBtn = document.getElementById('saveEditBtn');
    const editFlipHorizontalBtn = document.getElementById('editFlipHorizontalBtn');
    const editFlipVerticalBtn = document.getElementById('editFlipVerticalBtn');
    const editUndoBtn = document.getElementById('editUndoBtn');

    // Clipboard Voorvertoning
    const clipboardPreviewContainer = document.getElementById('clipboard-preview-container');
    const clipboardCanvas = document.getElementById('clipboardCanvas');
    const ctxClipboard = clipboardCanvas.getContext('2d');


    // --- STATE VARIABELEN ---
    let originalImage = null;
    let currentTool = 'potlood';
    let isDrawing = false;
    let startX, startY;

    let selectionRect = null;
    let undoStack = [];
    let editUndoStack = [];
    const MAX_UNDO_STATES = 20;

    let pastedObject = null;
    let isDraggingPastedObject = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;
    // AANGEPAST: Een nieuwe state-variabele om te weten of we een object voor het eerst plaatsen.
    let isPlacingNewObject = false;


    // --- EVENT LISTENERS ---
    uploadBtn.addEventListener('click', () => fileInput.click());
    opnieuwBtn.addEventListener('click', resetApplication);
    fileInput.addEventListener('change', handleImageUpload);
    downloadPngBtn.addEventListener('click', () => downloadPuzzel('png'));
    downloadPdfBtn.addEventListener('click', () => downloadPuzzel('pdf'));
    undoBtn.addEventListener('click', doUndo);

    toolButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelector('.tool-btn.active')?.classList.remove('active');
            btn.classList.add('active');
            currentTool = btn.dataset.tool;
            
            selectionToolsDiv.style.display = (currentTool === 'select' || pastedObject) ? 'flex' : 'none';
            gumSettingsDiv.style.display = (currentTool === 'gum') ? 'flex' : 'none';
            canvasVerschillen.style.cursor = getCursorForTool(currentTool);
        });
    });

    pasteBtn.style.display = 'none';

    saveEditBtn.addEventListener('click', saveAndPrepareForDrag);
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
        if (isDrawing || isDraggingPastedObject) {
            endAction(e);
        }
    });

    canvasVerschillen.addEventListener('mousemove', handleCursorUpdate);
    
    clipboardCanvas.addEventListener('mousedown', startDraggingFromPreview);


    // --- FUNCTIES ---

    function resetApplication() {
        canvasOrigineel.width = 400;
        canvasOrigineel.height = 600;
        canvasVerschillen.width = 400;
        canvasVerschillen.height = 600;
        ctxOrigineel.clearRect(0, 0, canvasOrigineel.width, canvasOrigineel.height);
        ctxVerschillen.clearRect(0, 0, canvasVerschillen.width, canvasVerschillen.height);

        originalImage = null;
        undoStack = [];
        selectionRect = null;
        isDrawing = false;
        
        pastedObject = null;
        isDraggingPastedObject = false;
        isPlacingNewObject = false;

        statusText.textContent = 'Upload een afbeelding om te beginnen.';
        undoBtn.disabled = true;
        downloadPngBtn.disabled = true;
        downloadPdfBtn.disabled = true;
        selectionToolsDiv.style.display = 'none';
        clipboardPreviewContainer.classList.add('hidden');
        
        fileInput.value = '';
    }

    function handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
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
                statusText.textContent = 'Afbeelding geladen. Kies een tool om te beginnen.';
            };
            originalImage.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    function resetApplicationStateAfterUpload() {
        undoStack = [];
        saveState();
        undoBtn.disabled = true;
        downloadPngBtn.disabled = false;
        downloadPdfBtn.disabled = false;
        pastedObject = null;
        isDraggingPastedObject = false;
        isPlacingNewObject = false;
        selectionToolsDiv.style.display = 'none';
        clipboardPreviewContainer.classList.add('hidden');
    }

    function getCursorForTool(tool) {
        const pencilCursor = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'%3E%3Cpath fill='black' stroke='white' stroke-width='1.5' d='M26.75 5.25L22.75 1.25C22.5 1 22.25 1 22 1.25L19 4.25L23.75 9L26.75 6C27 5.75 27 5.5 26.75 5.25Z'/%3E%3Cpath fill='black' stroke='white' stroke-width='1' d='M18.25 5L3.25 20C3 20.25 3 20.5 3.25 20.75L7.25 24.75C7.5 25 7.75 25 8 24.75L23 9.75L18.25 5Z'/%3E%3Cpath fill='rgba(0,0,0,0.5)' d='M3.25 20L8 24.75L7.25 21.5L3.25 20Z'/%3E%3C/svg%3E") 4 24, auto`;
        switch (tool) {
            case 'potlood':
            case 'lijn':
                return pencilCursor;
            case 'cirkel':
            case 'rechthoek':
                return 'crosshair';
            case 'gum':
                return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 18 18'%3E%3Ccircle cx='9' cy='9' r='7' fill='none' stroke='black' stroke-width='1.5'/%3E%3C/svg%3E") 9 9, auto`;
            case 'select':
                return 'default';
            default:
                return 'default';
        }
    }
    
    function handleCursorUpdate(e) {
        if (isDrawing || isDraggingPastedObject) return;
        
        if (pastedObject && pastedObject.x > -1) { // AANGEPAST: check of het object al geplaatst is
            const pos = getMousePos(canvasVerschillen, e);
            const isOnObject = pos.x >= pastedObject.x && pos.x <= pastedObject.x + pastedObject.width &&
                               pos.y >= pastedObject.y && pos.y <= pastedObject.y + pastedObject.height;

            canvasVerschillen.style.cursor = isOnObject ? 'move' : getCursorForTool(currentTool);
        } else {
            canvasVerschillen.style.cursor = getCursorForTool(currentTool);
        }
    }


    function getMousePos(canvas, evt) {
        const rect = canvas.getBoundingClientRect();
        return { x: evt.clientX - rect.left, y: evt.clientY - rect.top };
    }

    function startAction(e) {
        const pos = getMousePos(canvasVerschillen, e);

        // AANGEPAST: Logica om een reeds geplaatst object te verplaatsen.
        // We checken of er een geplaatst object is (pastedObject.x > -1) en of de muis erboven is.
        if (pastedObject && pastedObject.x > -1 &&
            pos.x >= pastedObject.x && pos.x <= pastedObject.x + pastedObject.width &&
            pos.y >= pastedObject.y && pos.y <= pastedObject.y + pastedObject.height) {

            isDraggingPastedObject = true;
            isPlacingNewObject = false; // We verplaatsen een bestaand object, niet een nieuw
            dragOffsetX = pos.x - pastedObject.x;
            dragOffsetY = pos.y - pastedObject.y;

            // AANGEPAST: We poppen de laatste staat van de stack, want die bevatte het object
            // op zijn oude plek. We herstellen de staat van DAARVOOR. Dit "pakt" het object op.
            if (undoStack.length > 1) {
                undoStack.pop(); 
                restoreState(undoStack[undoStack.length - 1]);
            }
            statusText.textContent = 'Object aan het verplaatsen...';
            return;
        }

        // Als we een nieuw object van het klembord slepen, negeren we andere mousedown events.
        if (isPlacingNewObject) return;

        if (!originalImage) return;

        isDrawing = true;
        startX = pos.x;
        startY = pos.y;
    }


    function moveAction(e) {
        if (!isDrawing && !isDraggingPastedObject) return;

        const pos = getMousePos(canvasVerschillen, e);

        // AANGEPAST: Robuustere logica voor het verplaatsen/slepen.
        if (isDraggingPastedObject && pastedObject) {
            // Herstel altijd de staat van VOOR de sleepactie begon.
            // Dit voorkomt "spookbeelden" en het terugkeren van gegomde delen.
            restoreState(undoStack[undoStack.length - 1]); 

            const currentX = pos.x - dragOffsetX;
            const currentY = pos.y - dragOffsetY;
            
            // Teken het object op de nieuwe plek.
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = pastedObject.width;
            tempCanvas.height = pastedObject.height;
            tempCanvas.getContext('2d').putImageData(pastedObject.imageData, 0, 0);
            ctxVerschillen.drawImage(tempCanvas, currentX, currentY);
            return;
        }

        if (!isDrawing) return;

        // Voor "rubberband" tools, herstel de staat voor we een nieuwe vorm tekenen.
        if (['lijn', 'rechthoek', 'cirkel', 'select'].includes(currentTool)) {
            restoreState(undoStack[undoStack.length - 1]);
        }

        setDrawingStyle();

        switch (currentTool) {
            case 'potlood':
                draw(pos.x, pos.y);
                startX = pos.x;
                startY = pos.y;
                break;
            case 'gum':
                erase(pos.x, pos.y);
                break;
            case 'select':
                drawSelectionRectangle(pos.x, pos.y);
                break;
            case 'lijn':
                drawLine(pos.x, pos.y);
                break;
            case 'rechthoek':
                drawRectangle(pos.x, pos.y);
                break;
            case 'cirkel':
                drawCircle(pos.x, pos.y);
                break;
        }
    }

    function endAction(e) {
        // AANGEPAST: Opgeschoonde logica voor het einde van een actie.
        if (isDraggingPastedObject && pastedObject) {
            isDraggingPastedObject = false;
            isPlacingNewObject = false;

            // Bepaal de definitieve positie van het object.
            const pos = getMousePos(canvasVerschillen, e);
            pastedObject.x = pos.x - dragOffsetX;
            pastedObject.y = pos.y - dragOffsetY;

            // Herstel de staat van voor de sleepactie en teken het object op de definitieve plek.
            restoreState(undoStack[undoStack.length - 1]);
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = pastedObject.width;
            tempCanvas.height = pastedObject.height;
            tempCanvas.getContext('2d').putImageData(pastedObject.imageData, 0, 0);
            ctxVerschillen.drawImage(tempCanvas, pastedObject.x, pastedObject.y);
            
            // Sla de nieuwe staat met het geplaatste object op.
            saveState();
            statusText.textContent = 'Object geplaatst. Beweeg erover om opnieuw te verplaatsen of kies een andere tool.';
            handleCursorUpdate(e);
            return;
        }

        if (!isDrawing) return;
        isDrawing = false;
        
        handleCursorUpdate(e);

        if (currentTool === 'select') {
            restoreState(undoStack[undoStack.length - 1]);
            if (selectionRect && selectionRect.width > 1 && selectionRect.height > 1) {
                openEditModalWithSelection();
            }
            selectionRect = null;
        } else if (['potlood', 'gum', 'lijn', 'rechthoek', 'cirkel'].includes(currentTool)) {
            saveState();
        }
    }

    function setDrawingStyle() {
        ctxVerschillen.strokeStyle = 'black';
        ctxVerschillen.lineWidth = dikteInput.value;
        ctxVerschillen.lineCap = 'round';
        ctxVerschillen.lineJoin = 'round';
    }


    function draw(x, y) {
        ctxVerschillen.beginPath();
        ctxVerschillen.moveTo(startX, startY);
        ctxVerschillen.lineTo(x, y);
        ctxVerschillen.stroke();
    }
    
    function erase(x, y) {
    const size = dikteInput.value;
    const halfSize = size / 2;
    const shape = gumvormSelect.value;

    ctxVerschillen.save();
    // AANGEPAST: Vul de geselecteerde vorm met de kleur wit.
    ctxVerschillen.fillStyle = 'white';
    ctxVerschillen.beginPath();
    if (shape === 'rond') {
        ctxVerschillen.arc(x, y, halfSize, 0, 2 * Math.PI);
    } else {
        ctxVerschillen.rect(x - halfSize, y - halfSize, size, size);
    }
    ctxVerschillen.fill();
    ctxVerschillen.restore();
}

    function drawLine(endX, endY) {
        ctxVerschillen.beginPath();
        ctxVerschillen.moveTo(startX, startY);
        ctxVerschillen.lineTo(endX, endY);
        ctxVerschillen.stroke();
    }

    function drawRectangle(endX, endY) {
        const width = endX - startX;
        const height = endY - startY;
        ctxVerschillen.strokeRect(startX, startY, width, height);
    }
    
    function drawCircle(endX, endY) {
        const radius = Math.hypot(endX - startX, endY - startY);
        ctxVerschillen.beginPath();
        ctxVerschillen.arc(startX, startY, radius, 0, 2 * Math.PI);
        ctxVerschillen.stroke();
    }

    function drawSelectionRectangle(endX, endY) {
        selectionRect = {
            x: Math.min(startX, endX),
            y: Math.min(startY, endY),
            width: Math.abs(startX - endX),
            height: Math.abs(startY - endY)
        };
        ctxVerschillen.save();
        ctxVerschillen.strokeStyle = '#555';
        ctxVerschillen.lineWidth = 1;
        ctxVerschillen.setLineDash([5, 5]);
        ctxVerschillen.strokeRect(selectionRect.x, selectionRect.y, selectionRect.width, selectionRect.height);
        ctxVerschillen.restore();
    }

    function openEditModalWithSelection() {
        if (selectionRect && selectionRect.width > 0 && selectionRect.height > 0) {
            let imageData = ctxVerschillen.getImageData(selectionRect.x, selectionRect.y, selectionRect.width, selectionRect.height);
            // We hoeven de achtergrond niet transparant te maken; we gaan het hele geselecteerde deel bewerken.
            editCanvas.width = selectionRect.width;
            editCanvas.height = selectionRect.height;
            ctxEdit.putImageData(imageData, 0, 0);
            
            editUndoStack = [];
            saveEditState();

            editModalOverlay.classList.remove('hidden');
            statusText.textContent = 'Bewerk de selectie in de pop-up.';
        }
    }
    
    // Deze functie is niet langer nodig omdat we de selectie direct bewerken.
    // function maakAchtergrondTransparant(imageData) { ... }

    function eraseOnEditCanvas(e) {
        const rect = editCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        // Gebruik clearRect om transparantie te creëren.
        ctxEdit.clearRect(x - 5, y - 5, 10, 10);
    }
    
    // AANGEPAST: Deze functie start niet langer de sleepactie.
    function saveAndPrepareForDrag() {
        const editedImageData = ctxEdit.getImageData(0, 0, editCanvas.width, editCanvas.height);
        editModalOverlay.classList.add('hidden');
        
        clipboardCanvas.width = editedImageData.width;
        clipboardCanvas.height = editedImageData.height;
        ctxClipboard.putImageData(editedImageData, 0, 0);
        clipboardPreviewContainer.classList.remove('hidden');
        clipboardCanvas.style.cursor = 'grab';

        // Maak het object klaar, maar zet de positie op -1 om aan te geven
        // dat het nog niet op de canvas geplaatst is.
        pastedObject = {
            imageData: editedImageData,
            x: -1, y: -1,
            width: editedImageData.width,
            height: editedImageData.height
        };
        
        document.querySelector('.tool-btn[data-tool="select"]').click();
        
        // AANGEPAST: Duidelijkere instructie.
        statusText.textContent = 'Selectie opgeslagen. Sleep het vanuit het vak hieronder naar de puzzel.';
    }

    // AANGEPAST: Dit is de functie die de sleepactie nu ECHT start.
    function startDraggingFromPreview(e) {
        if (!pastedObject) return;
        
        e.preventDefault();
        isDraggingPastedObject = true;
        isPlacingNewObject = true;

        // Als een vorig object al geplaatst was, resetten we dat hier niet.
        // Een nieuw object van het klembord overschrijft het vorige.

        dragOffsetX = pastedObject.width / 2;
        dragOffsetY = pastedObject.height / 2;
        
        statusText.textContent = 'Sleep de selectie naar de juiste plek en laat los.';
        canvasVerschillen.style.cursor = 'grabbing';
    }


    function transformEditCanvas(scaleX, scaleY) {
        const imageData = ctxEdit.getImageData(0, 0, editCanvas.width, editCanvas.height);
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = editCanvas.width;
        tempCanvas.height = editCanvas.height;
        tempCanvas.getContext('2d').putImageData(imageData, 0, 0);
        
        ctxEdit.clearRect(0, 0, editCanvas.width, editCanvas.height);
        ctxEdit.save();
        ctxEdit.translate(scaleX === -1 ? editCanvas.width : 0, scaleY === -1 ? editCanvas.height : 0);
        ctxEdit.scale(scaleX, scaleY);
        ctxEdit.drawImage(tempCanvas, 0, 0);
        ctxEdit.restore();
    }

    function saveState() {
        if (undoStack.length >= MAX_UNDO_STATES) {
            undoStack.shift();
        }
        undoStack.push(ctxVerschillen.getImageData(0, 0, canvasVerschillen.width, canvasVerschillen.height));
        undoBtn.disabled = undoStack.length <= 1;
    }

    function restoreState(imageData) {
        if (imageData) {
            ctxVerschillen.putImageData(imageData, 0, 0);
        }
    }

    function doUndo() {
        if (undoStack.length > 1) {
            // AANGEPAST: Als de laatste actie het plaatsen van een object was,
            // moeten we dat object ook resetten.
            if(pastedObject && pastedObject.x > -1) {
                const lastState = undoStack[undoStack.length-1];
                const lastPastedObjectBounds = {
                    x: pastedObject.x,
                    y: pastedObject.y,
                    w: pastedObject.width,
                    h: pastedObject.height
                };
                 // Check of de undo actie het object zal verwijderen
                 // Dit is een simpele check en kan verfijnd worden
                pastedObject = null;
                clipboardPreviewContainer.classList.add('hidden');
            }

            undoStack.pop();
            const prevState = undoStack[undoStack.length - 1];
            restoreState(prevState);
            undoBtn.disabled = undoStack.length <= 1;

        }
    }

    function saveEditState() {
        if (editUndoStack.length >= MAX_UNDO_STATES) {
            editUndoStack.shift();
        }
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
            const prevState = editUndoStack[editUndoStack.length - 1];
            restoreEditState(prevState);
            editUndoBtn.disabled = editUndoStack.length <= 1;
        }
    }

    function downloadPuzzel(format) {
        // AANGEPAST: De logica om het object permanent te 'stampen' voor download
        // is nu verplaatst naar de endAction. De canvas is dus altijd klaar voor download.
        // We hoeven hier niets speciaals meer te doen.

        if (format === 'pdf') {
            const { jsPDF } = window.jspdf;
            const gap = 40;
            const borderWidth = 4;
            
            const sourceCanvas = document.createElement('canvas');
            const sourceCtx = sourceCanvas.getContext('2d');
            sourceCanvas.width = canvasOrigineel.width;
            sourceCanvas.height = (canvasOrigineel.height * 2) + gap;

            sourceCtx.fillStyle = 'white';
            sourceCtx.fillRect(0, 0, sourceCanvas.width, sourceCanvas.height);
            sourceCtx.drawImage(canvasOrigineel, 0, 0);
            sourceCtx.drawImage(canvasVerschillen, 0, canvasOrigineel.height + gap);
            sourceCtx.strokeStyle = '#004080';
            sourceCtx.lineWidth = borderWidth;
            sourceCtx.strokeRect(borderWidth / 2, borderWidth / 2, sourceCanvas.width - borderWidth, canvasOrigineel.height - borderWidth);
            sourceCtx.strokeRect(borderWidth / 2, canvasOrigineel.height + gap + (borderWidth / 2), sourceCanvas.width - borderWidth, canvasOrigineel.height - borderWidth);
            
            const dataURL = sourceCanvas.toDataURL('image/png');
            
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'pt',
                format: 'a4'
            });

            const a4Width = 595.28;
            const a4Height = 841.89;
            const margin = 40;

            const availableWidth = a4Width - (margin * 2);
            const availableHeight = a4Height - (margin * 2);

            const scale = Math.min(availableWidth / sourceCanvas.width, availableHeight / sourceCanvas.height);
            
            const imgWidth = sourceCanvas.width * scale;
            const imgHeight = sourceCanvas.height * scale;

            const x = (a4Width - imgWidth) / 2;
            const y = (a4Height - imgHeight) / 2;
            
            doc.addImage(dataURL, 'PNG', x, y, imgWidth, imgHeight);
            doc.save('zoek-de-verschillen-puzzel.pdf');

        } else { // PNG-download
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            const gap = 20;
            tempCanvas.width = canvasOrigineel.width * 2 + gap;
            tempCanvas.height = canvasOrigineel.height;

            tempCtx.fillStyle = 'white';
            tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
            tempCtx.drawImage(canvasOrigineel, 0, 0);
            tempCtx.drawImage(canvasVerschillen, canvasOrigineel.width + gap, 0);
            
            const dataURL = tempCanvas.toDataURL('image/png');
            const a = document.createElement('a');
            a.href = dataURL;
            a.download = 'zoek-de-verschillen-puzzel.png';
            a.click();
        }
    }
});
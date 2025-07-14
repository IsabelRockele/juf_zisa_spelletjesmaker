document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENTEN KOPPELEN ---
    const uploadBtn = document.getElementById('uploadImageBtn');
    const fileInput = document.getElementById('fileInput');
    const downloadPngBtn = document.getElementById('downloadPngBtn');
    const downloadPdfBtn = document.getElementById('downloadPdfBtn');
    const undoBtn = document.getElementById('undoBtn');
    
    const canvasOrigineel = document.getElementById('canvasOrigineel');
    const ctxOrigineel = canvasOrigineel.getContext('2d');
    const canvasVerschillen = document.getElementById('canvasVerschillen');
    const ctxVerschillen = canvasVerschillen.getContext('2d');

    const statusText = document.getElementById('status-text');
    
    // Tools
    const toolButtons = document.querySelectorAll('.tool-btn');
    const selectionToolsDiv = document.getElementById('selection-tools');
    const copyBtn = document.getElementById('copyBtn');
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
    const editUndoBtn = document.getElementById('editUndoBtn'); // Nieuwe knop

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
    let floatingSelectionData = null;
    let isPasting = false;

    let undoStack = [];
    let editUndoStack = []; // Nieuwe undo-stack voor de edit modal
    const MAX_UNDO_STATES = 20;

    // --- EVENT LISTENERS ---
    uploadBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleImageUpload);
    downloadPngBtn.addEventListener('click', () => downloadPuzzel('png'));
    downloadPdfBtn.addEventListener('click', () => downloadPuzzel('pdf'));
    undoBtn.addEventListener('click', doUndo);

    toolButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            if(isPasting) {
                isPasting = false;
                canvasVerschillen.style.cursor = 'default';
                statusText.textContent = 'Plak-modus gedeactiveerd. Je selectie is nog beschikbaar.';
            }

            document.querySelector('.tool-btn.active')?.classList.remove('active');
            btn.classList.add('active');
            currentTool = btn.dataset.tool;
            
            const hasClipboardData = floatingSelectionData !== null;
            selectionToolsDiv.style.display = (currentTool === 'select' || hasClipboardData) ? 'flex' : 'none';
            
            gumSettingsDiv.style.display = (currentTool === 'gum') ? 'flex' : 'none';
            canvasVerschillen.style.cursor = getCursorForTool(currentTool);
        });
    });

    copyBtn.addEventListener('click', copySelection);
    pasteBtn.addEventListener('click', prepareToPaste);

    // Bewerkings-modal knoppen
    saveEditBtn.addEventListener('click', saveAndShowPreview);
    editUndoBtn.addEventListener('click', doEditUndo); // Nieuwe listener
    editFlipHorizontalBtn.addEventListener('click', () => { transformEditCanvas(-1, 1); saveEditState(); });
    editFlipVerticalBtn.addEventListener('click', () => { transformEditCanvas(1, -1); saveEditState(); });
    
    // Bewerkings-modal canvas events
    editCanvas.addEventListener('mousedown', () => isDrawing = true);
    editCanvas.addEventListener('mouseup', () => { if(isDrawing) { saveEditState(); isDrawing = false; } });
    editCanvas.addEventListener('mouseleave', () => { if(isDrawing) { saveEditState(); isDrawing = false; } });
    editCanvas.addEventListener('mousemove', (e) => { if (e.buttons === 1) eraseOnEditCanvas(e); });

    // Hoofd canvas events
    canvasVerschillen.addEventListener('mousedown', startAction);
    canvasVerschillen.addEventListener('mousemove', moveAction);
    canvasVerschillen.addEventListener('mouseup', endAction);
    canvasVerschillen.addEventListener('mouseleave', () => {
        if (isPasting) {
            restoreState(undoStack[undoStack.length - 1]);
        }
        if(isDrawing) { 
            endAction(); 
        }
    });


    // --- FUNCTIES ---

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
                
                undoStack = [];
                saveState();
                undoBtn.disabled = true;
                downloadPngBtn.disabled = false;
                downloadPdfBtn.disabled = false;
                pasteBtn.disabled = true;
                floatingSelectionData = null;
                selectionToolsDiv.style.display = 'none';
                clipboardPreviewContainer.classList.add('hidden');
                statusText.textContent = 'Afbeelding geladen. Kies een tool om te beginnen.';
            };
            originalImage.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    function getCursorForTool(tool) {
        switch(tool) {
            case 'potlood': return 'crosshair';
            case 'gum': return 'cell';
            case 'select': return 'default';
            default: return 'default';
        }
    }

    function getMousePos(canvas, evt) {
        const rect = canvas.getBoundingClientRect();
        return { x: evt.clientX - rect.left, y: evt.clientY - rect.top };
    }

    function startAction(e) {
        const pos = getMousePos(canvasVerschillen, e);
        
        if (isPasting && floatingSelectionData) {
            restoreState(undoStack[undoStack.length - 1]);
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = floatingSelectionData.width;
            tempCanvas.height = floatingSelectionData.height;
            tempCanvas.getContext('2d').putImageData(floatingSelectionData, 0, 0);
            
            ctxVerschillen.drawImage(tempCanvas, pos.x - tempCanvas.width / 2, pos.y - tempCanvas.height / 2);
            
            saveState();
            isPasting = false;
            floatingSelectionData = null;
            canvasVerschillen.style.cursor = getCursorForTool(currentTool);
            statusText.textContent = 'Selectie geplaatst. Maak een nieuwe selectie of kies een andere tool.';
            pasteBtn.disabled = true;
            clipboardPreviewContainer.classList.add('hidden');

            if (currentTool !== 'select') {
                selectionToolsDiv.style.display = 'none';
            }
            return;
        }
        
        if (!originalImage) return;
        isDrawing = true;
        startX = pos.x;
        startY = pos.y;
    }

    function moveAction(e) {
        if (isPasting && floatingSelectionData) {
            restoreState(undoStack[undoStack.length - 1]);
            const pos = getMousePos(canvasVerschillen, e);
            
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = floatingSelectionData.width;
            tempCanvas.height = floatingSelectionData.height;
            tempCanvas.getContext('2d').putImageData(floatingSelectionData, 0, 0);

            ctxVerschillen.drawImage(tempCanvas, pos.x - tempCanvas.width / 2, pos.y - tempCanvas.height / 2);
            return;
        }

        if (!isDrawing) return;
        const pos = getMousePos(canvasVerschillen, e);
        if (currentTool === 'potlood') {
            draw(pos.x, pos.y);
            startX = pos.x;
            startY = pos.y;
        } else if (currentTool === 'gum') {
            erase(pos.x, pos.y);
        } else if (currentTool === 'select') {
            restoreState(undoStack[undoStack.length - 1]);
            drawSelectionRectangle(pos.x, pos.y);
        }
    }

    function endAction(e) {
        if (!isDrawing) return;
        isDrawing = false;
        
        if (currentTool === 'select') {
            const rect = canvasVerschillen.getBoundingClientRect();
            const endX = e.clientX - rect.left;
            const endY = e.clientY - rect.top;

            selectionRect = {
                x: Math.min(startX, endX),
                y: Math.min(startY, endY),
                width: Math.abs(startX - endX),
                height: Math.abs(startY - endY)
            };
            restoreState(undoStack[undoStack.length - 1]);
            drawSelectionRectangle(endX, endY, true);
        } else if (currentTool === 'potlood' || currentTool === 'gum') {
            saveState();
        }
    }
    
    function draw(x, y) {
        ctxVerschillen.beginPath();
        ctxVerschillen.moveTo(startX, startY);
        ctxVerschillen.lineTo(x, y);
        ctxVerschillen.strokeStyle = 'black';
        ctxVerschillen.lineWidth = dikteInput.value;
        ctxVerschillen.lineCap = 'round';
        ctxVerschillen.lineJoin = 'round';
        ctxVerschillen.stroke();
    }

    function erase(x, y) {
        const size = dikteInput.value;
        const halfSize = size / 2;
        const shape = gumvormSelect.value;
        ctxVerschillen.save();
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
    
    function drawSelectionRectangle(endX, endY, isFinal = false) {
        ctxVerschillen.save();
        ctxVerschillen.strokeStyle = isFinal ? 'blue' : '#555';
        ctxVerschillen.lineWidth = 1;
        if (!isFinal) ctxVerschillen.setLineDash([5, 5]);
        const width = endX - startX;
        const height = endY - startY;
        ctxVerschillen.strokeRect(startX, startY, width, height);
        ctxVerschillen.restore();
    }

    function copySelection() {
        restoreState(undoStack[undoStack.length - 1]);

        if (selectionRect && selectionRect.width > 0 && selectionRect.height > 0) {
            let imageData = ctxVerschillen.getImageData(selectionRect.x, selectionRect.y, selectionRect.width, selectionRect.height);
            imageData = maakAchtergrondTransparant(imageData);
            editCanvas.width = selectionRect.width;
            editCanvas.height = selectionRect.height;
            ctxEdit.putImageData(imageData, 0, 0);
            
            // Initialiseer de undo stack voor de modal
            editUndoStack = [];
            saveEditState();

            editModalOverlay.classList.remove('hidden');
            statusText.textContent = 'Bewerk de selectie in de pop-up.';
        } else {
            alert("Maak eerst een selectie.");
        }
    }
    
    function maakAchtergrondTransparant(imageData) {
        const pixels = imageData.data;
        const tolerance = 240;
        for (let i = 0; i < pixels.length; i += 4) {
            if (pixels[i] > tolerance && pixels[i+1] > tolerance && pixels[i+2] > tolerance) {
                pixels[i+3] = 0; // Alpha
            }
        }
        return imageData;
    }

    function eraseOnEditCanvas(e) {
        const rect = editCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        ctxEdit.clearRect(x - 5, y - 5, 10, 10);
    }

    function saveAndShowPreview() {
        floatingSelectionData = ctxEdit.getImageData(0, 0, editCanvas.width, editCanvas.height);
        editModalOverlay.classList.add('hidden');
        
        clipboardCanvas.width = floatingSelectionData.width;
        clipboardCanvas.height = floatingSelectionData.height;
        ctxClipboard.putImageData(floatingSelectionData, 0, 0);
        clipboardPreviewContainer.classList.remove('hidden');

        pasteBtn.disabled = false;
        statusText.textContent = 'Selectie opgeslagen. Gum de oude plek weg en klik op "Plak" om de plak-modus te activeren.';
    }

    function prepareToPaste() {
        if (floatingSelectionData) {
            isPasting = true;
            canvasVerschillen.style.cursor = 'copy';
            statusText.textContent = 'Plak-modus actief. Beweeg over het canvas en klik om de selectie te plaatsen.';
        } else {
            alert("Er is geen opgeslagen selectie om te plakken. Gebruik eerst 'Knip & Bewerk'.");
        }
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

    // --- Hoofd Undo/Redo Functies ---
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
            undoStack.pop();
            const prevState = undoStack[undoStack.length - 1];
            restoreState(prevState);
            undoBtn.disabled = undoStack.length <= 1;
        }
    }

    // --- Nieuwe Undo Functies voor de Edit Modal ---
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
        restoreState(undoStack[undoStack.length - 1]);
        
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
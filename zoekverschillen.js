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
    const dikteInput = document.getElementById('dikte');
    const gumvormSelect = document.getElementById('gumvorm');
    const gumSettingsDiv = document.getElementById('gum-settings');

    // Modal
    const editModalOverlay = document.getElementById('edit-modal-overlay');
    const editCanvas = document.getElementById('editCanvas');
    const ctxEdit = editCanvas.getContext('2d');
    const saveEditBtn = document.getElementById('saveEditBtn');
    const editFlipHorizontalBtn = document.getElementById('editFlipHorizontalBtn');
    const editFlipVerticalBtn = document.getElementById('editFlipVerticalBtn');
    const editUndoBtn = document.getElementById('editUndoBtn');
    const transparentBgCheckbox = document.getElementById('transparentBgCheckbox');

    // Clipboard
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
    let isPlacingNewObject = false;
    
    let transformAction = 'none'; 
    let dragStart = { x: 0, y: 0 };


    // --- EVENT LISTENERS ---
    uploadBtn.addEventListener('click', () => fileInput.click());
    opnieuwBtn.addEventListener('click', resetApplication);
    fileInput.addEventListener('change', handleImageUpload);
    downloadPngBtn.addEventListener('click', () => downloadPuzzel('png'));
    downloadPdfBtn.addEventListener('click', () => downloadPuzzel('pdf'));
    undoBtn.addEventListener('click', doUndo);

    toolButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            stampPastedObject();
            document.querySelector('.tool-btn.active')?.classList.remove('active');
            btn.classList.add('active');
            currentTool = btn.dataset.tool;
            gumSettingsDiv.style.display = (currentTool === 'gum') ? 'flex' : 'none';
            canvasVerschillen.style.cursor = getCursorForTool(currentTool);
        });
    });

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
        if (isDrawing || transformAction !== 'none' || isPlacingNewObject) {
            endAction(e);
        }
    });

    canvasVerschillen.addEventListener('mousemove', handleCursorUpdate);
    
    clipboardCanvas.addEventListener('mousedown', startDraggingFromPreview);


    // --- FUNCTIES ---

    function resetApplication() {
        canvasOrigineel.width = 400; canvasOrigineel.height = 600;
        canvasVerschillen.width = 400; canvasVerschillen.height = 600;
        ctxOrigineel.clearRect(0, 0, canvasOrigineel.width, canvasOrigineel.height);
        ctxVerschillen.clearRect(0, 0, canvasVerschillen.width, canvasVerschillen.height);

        originalImage = null; undoStack = []; selectionRect = null;
        isDrawing = false; pastedObject = null;
        isPlacingNewObject = false; transformAction = 'none';

        statusText.textContent = 'Upload een afbeelding om te beginnen.';
        undoBtn.disabled = true; downloadPngBtn.disabled = true; downloadPdfBtn.disabled = true;
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
        undoStack = []; saveState();
        undoBtn.disabled = true;
        downloadPngBtn.disabled = false;
        downloadPdfBtn.disabled = false;
        pastedObject = null; transformAction = 'none';
        selectionToolsDiv.style.display = 'none';
        clipboardPreviewContainer.classList.add('hidden');
    }

    function getCursorForTool(tool) {
        switch (tool) {
            case 'potlood': case 'lijn': return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'%3E%3Cpath fill='black' stroke='white' stroke-width='1.5' d='M26.75 5.25L22.75 1.25C22.5 1 22.25 1 22 1.25L19 4.25L23.75 9L26.75 6C27 5.75 27 5.5 26.75 5.25Z'/%3E%3Cpath fill='black' stroke='white' stroke-width='1' d='M18.25 5L3.25 20C3 20.25 3 20.5 3.25 20.75L7.25 24.75C7.5 25 7.75 25 8 24.75L23 9.75L18.25 5Z'/%3E%3Cpath fill='rgba(0,0,0,0.5)' d='M3.25 20L8 24.75L7.25 21.5L3.25 20Z'/%3E%3C/svg%3E") 4 24, auto`;
            case 'cirkel': case 'rechthoek': return 'crosshair';
            case 'gum': return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 18 18'%3E%3Ccircle cx='9' cy='9' r='7' fill='none' stroke='black' stroke-width='1.5'/%3E%3C/svg%3E") 9 9, auto`;
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

    function drawPastedObject() {
        if (!pastedObject || pastedObject.x < 0) return;
        const { x, y, scale, rotation, width, height, imageData } = pastedObject;
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        tempCanvas.getContext('2d').putImageData(imageData, 0, 0);
        ctxVerschillen.save();
        ctxVerschillen.translate(x, y);
        ctxVerschillen.rotate(rotation);
        ctxVerschillen.drawImage(tempCanvas, -width / 2, -height / 2, width * scale, height * scale);
        ctxVerschillen.restore();
    }

    function drawTransformHandles() {
        if (!pastedObject || pastedObject.x < 0) return;
        const handles = getTransformHandles(pastedObject);
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
        if (!pastedObject || pastedObject.x < 0) return 'none';
        const handles = getTransformHandles(pastedObject);
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
    
    function redrawCanvasWithPastedObject() {
        if (!pastedObject) return;
        restoreState(undoStack[undoStack.length - 1]);
        drawPastedObject();
        if (pastedObject.x > -1) {
            drawTransformHandles();
        }
    }

    function stampPastedObject() {
        if (!pastedObject || pastedObject.x < 0) return;
        restoreState(undoStack[undoStack.length - 1]);
        drawPastedObject();
        pastedObject = null;
        transformAction = 'none';
        saveState();
        selectionToolsDiv.style.display = 'none';
        clipboardPreviewContainer.classList.add('hidden');
        statusText.textContent = 'Object vastgezet.';
        canvasVerschillen.style.cursor = 'default';
    }

    function startAction(e) {
        const pos = getMousePos(canvasVerschillen, e);
        transformAction = getActionForPoint(pos);
        if (transformAction !== 'none') {
            dragStart = pos;
            return;
        }
        stampPastedObject();
        if (!originalImage) return;
        isDrawing = true;
        startX = pos.x;
        startY = pos.y;
    }

    function moveAction(e) {
        if (isPlacingNewObject && pastedObject) {
            const pos = getMousePos(canvasVerschillen, e);
            pastedObject.x = pos.x;
            pastedObject.y = pos.y;
            redrawCanvasWithPastedObject();
            return;
        }
        if (transformAction !== 'none' && pastedObject) {
            const pos = getMousePos(canvasVerschillen, e);
            if (transformAction === 'move') {
                pastedObject.x += pos.x - dragStart.x;
                pastedObject.y += pos.y - dragStart.y;
            } else if (transformAction === 'rotate') {
                const angle = Math.atan2(pos.y - pastedObject.y, pos.x - pastedObject.x);
                const startAngle = Math.atan2(dragStart.y - pastedObject.y, dragStart.x - pastedObject.x);
                pastedObject.rotation += angle - startAngle;
            } else if (transformAction === 'scale') {
                const dist = Math.hypot(pos.x - pastedObject.x, pos.y - pastedObject.y);
                const startDist = Math.hypot(dragStart.x - pastedObject.x, dragStart.y - pastedObject.y);
                if (startDist > 0) pastedObject.scale *= dist / startDist;
            }
            dragStart = pos;
            redrawCanvasWithPastedObject();
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
        if (isPlacingNewObject && pastedObject) {
            isPlacingNewObject = false;
            statusText.textContent = 'Object geplaatst. Verplaats, roteer of schaal het. Klik ernaast om vast te zetten.';
            handleCursorUpdate(e);
            return;
        }
        if (transformAction !== 'none') {
            transformAction = 'none';
        }
        if (!isDrawing) return;
        isDrawing = false;
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

    function setDrawingStyle() { ctxVerschillen.strokeStyle = 'black'; ctxVerschillen.lineWidth = dikteInput.value; ctxVerschillen.lineCap = 'round'; ctxVerschillen.lineJoin = 'round'; }
    function draw(x, y) { ctxVerschillen.beginPath(); ctxVerschillen.moveTo(startX, startY); ctxVerschillen.lineTo(x, y); ctxVerschillen.stroke(); }
    function erase(x, y) { const size = dikteInput.value; const halfSize = size / 2; const shape = gumvormSelect.value; ctxVerschillen.save(); ctxVerschillen.fillStyle = 'white'; ctxVerschillen.beginPath(); if (shape === 'rond') { ctxVerschillen.arc(x, y, halfSize, 0, Math.PI * 2); } else { ctxVerschillen.rect(x - halfSize, y - halfSize, size, size); } ctxVerschillen.fill(); ctxVerschillen.restore(); }
    function drawLine(endX, endY) { ctxVerschillen.beginPath(); ctxVerschillen.moveTo(startX, startY); ctxVerschillen.lineTo(endX, endY); ctxVerschillen.stroke(); }
    function drawRectangle(endX, endY) { ctxVerschillen.strokeRect(startX, startY, endX - startX, endY - startY); }
    function drawCircle(endX, endY) { const radius = Math.hypot(endX - startX, endY - startY); ctxVerschillen.beginPath(); ctxVerschillen.arc(startX, startY, radius, 0, 2 * Math.PI); ctxVerschillen.stroke(); }
    function drawSelectionRectangle(endX, endY) { selectionRect = { x: Math.min(startX, endX), y: Math.min(startY, endY), width: Math.abs(startX - endX), height: Math.abs(startY - endY) }; ctxVerschillen.save(); ctxVerschillen.strokeStyle = '#555'; ctxVerschillen.lineWidth = 1; ctxVerschillen.setLineDash([5, 5]); ctxVerschillen.strokeRect(selectionRect.x, selectionRect.y, selectionRect.width, selectionRect.height); ctxVerschillen.restore(); }

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
    
    function saveAndPrepareForDrag() {
        let editedImageData = ctxEdit.getImageData(0, 0, editCanvas.width, editCanvas.height);

        if (transparentBgCheckbox.checked) {
            const data = editedImageData.data;
            const bgR = data[0];
            const bgG = data[1];
            const bgB = data[2];
            const tolerance = 10; // Kleine tolerantie voor lichte kleurvariaties

            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                if (Math.abs(r - bgR) < tolerance && Math.abs(g - bgG) < tolerance && Math.abs(b - bgB) < tolerance) {
                    data[i + 3] = 0; // Alpha op 0 zetten (transparant)
                }
            }
        }
        transparentBgCheckbox.checked = false;

        editModalOverlay.classList.add('hidden');
        clipboardCanvas.width = editedImageData.width; clipboardCanvas.height = editedImageData.height;
        ctxClipboard.putImageData(editedImageData, 0, 0);
        selectionToolsDiv.style.display = 'flex';
        clipboardPreviewContainer.classList.remove('hidden');
        clipboardCanvas.style.cursor = 'grab';
        pastedObject = { imageData: editedImageData, x: -1, y: -1, width: editedImageData.width, height: editedImageData.height, scale: 1, rotation: 0 };
        statusText.textContent = 'Sleep het object vanuit het vak hieronder naar de puzzel.';
    }

    function startDraggingFromPreview(e) {
        if (!pastedObject) return;
        e.preventDefault();
        isPlacingNewObject = true;
        saveState();
        statusText.textContent = 'Sleep het object naar de juiste plek en laat los.';
        canvasVerschillen.style.cursor = 'grabbing';
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
        undoStack.push(ctxVerschillen.getImageData(0, 0, canvasVerschillen.width, canvasVerschillen.height));
        undoBtn.disabled = undoStack.length <= 1;
    }

    function restoreState(imageData) { if (imageData) { ctxVerschillen.putImageData(imageData, 0, 0); } }

    function doUndo() {
        pastedObject = null; transformAction = 'none';
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

    function doEditUndo() {
        if (editUndoStack.length > 1) {
            editUndoStack.pop();
            restoreEditState(editUndoStack[editUndoStack.length - 1]);
            editUndoBtn.disabled = editUndoStack.length <= 1;
        }
    }

    function downloadPuzzel(format) {
        stampPastedObject();
        if (format === 'pdf') {
            const { jsPDF } = window.jspdf;
            const gap = 40, borderWidth = 4;
            const sourceCanvas = document.createElement('canvas');
            const sourceCtx = sourceCanvas.getContext('2d');
            sourceCanvas.width = canvasOrigineel.width; sourceCanvas.height = (canvasOrigineel.height * 2) + gap;
            sourceCtx.fillStyle = 'white';
            sourceCtx.fillRect(0, 0, sourceCanvas.width, sourceCanvas.height);
            sourceCtx.drawImage(canvasOrigineel, 0, 0);
            sourceCtx.drawImage(canvasVerschillen, 0, canvasOrigineel.height + gap);
            sourceCtx.strokeStyle = '#004080';
            sourceCtx.lineWidth = borderWidth;
            sourceCtx.strokeRect(borderWidth / 2, borderWidth / 2, sourceCanvas.width - borderWidth, canvasOrigineel.height - borderWidth);
            sourceCtx.strokeRect(borderWidth / 2, canvasOrigineel.height + gap + (borderWidth / 2), sourceCanvas.width - borderWidth, canvasOrigineel.height - borderWidth);
            const dataURL = sourceCanvas.toDataURL('image/png');
            const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
            const a4Width = 595.28, a4Height = 841.89, margin = 40;
            const availableWidth = a4Width - (margin * 2), availableHeight = a4Height - (margin * 2);
            const scale = Math.min(availableWidth / sourceCanvas.width, availableHeight / sourceCanvas.height);
            const imgWidth = sourceCanvas.width * scale, imgHeight = sourceCanvas.height * scale;
            const x = (a4Width - imgWidth) / 2, y = (a4Height - imgHeight) / 2;
            doc.addImage(dataURL, 'PNG', x, y, imgWidth, imgHeight);
            doc.save('zoek-de-verschillen-puzzel.pdf');
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
document.addEventListener('DOMContentLoaded', () => {

    const makerTabs = Array.from(document.querySelectorAll('.maker-tabs [role="tab"]'));
    function selectMakerTab(tab) {
        makerTabs.forEach(item => {
            const active = item === tab;
            item.setAttribute('aria-selected', String(active));
            item.tabIndex = active ? 0 : -1;
            document.getElementById(item.getAttribute('aria-controls')).hidden = !active;
        });
        document.getElementById('left-panel').scrollTop = 0;
    }
    makerTabs.forEach((tab,index) => {
        tab.addEventListener('click', () => selectMakerTab(tab));
        tab.addEventListener('keydown', event => {
            if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
            event.preventDefault();
            const next = event.key === 'Home' ? 0 : event.key === 'End' ? makerTabs.length-1 : (index+1)%makerTabs.length;
            selectMakerTab(makerTabs[next]); makerTabs[next].focus();
        });
    });

    // --- Globale Variabelen & State ---
    let originalFiles = [];
    let generatedItems = [];
    let isMoveModeEnabled = false;
    let selectedItem = null;

    // --- Element Referenties ---
    const imageUpload = document.getElementById('imageUpload');
    const uploadTriggerBtn = document.getElementById('uploadTriggerBtn');
    const fileFeedback = document.getElementById('file-feedback');
    const createShadowsBtn = document.getElementById('create-shadows-btn');
    const renderWorksheetBtn = document.getElementById('render-worksheet-btn');
    const werkbladWeergave = document.getElementById('werkbladWeergave');
    const downloadPdfBtn = document.getElementById('downloadPdfBtn');
    const resetBtn = document.getElementById('resetBtn');
    const hiddenCanvas = document.getElementById('hiddenCanvas');
    const werkbladTypeRadios = document.querySelectorAll('input[name="werkbladType"]');
    const editControls = document.getElementById('edit-controls');
    const enableMoveBtn = document.getElementById('enable-move-btn');
    const resizeControls = document.getElementById('resize-controls');
    const increaseSizeBtn = document.getElementById('increase-size-btn');
    const decreaseSizeBtn = document.getElementById('decrease-size-btn');
    const sizeFeedback = document.getElementById('size-feedback');

    // --- Hulpfuncties ---
    function createImage(src, alt) {
        const img = document.createElement('img');
        img.src = src;
        img.alt = alt;
        return img;
    }

    function createItemWrapper(imgSrc, imgAlt) {
        const wrapper = document.createElement('div');
        wrapper.className = 'item-wrapper';
        wrapper.appendChild(createImage(imgSrc, imgAlt));
        return wrapper;
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // --- Weergave Functies ---
    function displayOriginalImages() {
        werkbladWeergave.innerHTML = '';
        werkbladWeergave.className = 'preview-grid';
        originalFiles.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'image-preview-item';
                const img = document.createElement('img');
                img.src = e.target.result;
                itemDiv.appendChild(img);
                werkbladWeergave.appendChild(itemDiv);
            };
            reader.readAsDataURL(file);
        });
    }

    function displayShadowPairs() {
        werkbladWeergave.innerHTML = '';
        werkbladWeergave.className = 'preview-grid';
        generatedItems.forEach(item => {
            const pairDiv = document.createElement('div');
            pairDiv.className = 'shadow-pair-container';
            const originalWrapper = document.createElement('div');
            originalWrapper.className = 'image-wrapper';
            originalWrapper.appendChild(createImage(item.original, 'Origineel'));
            const shadowWrapper = document.createElement('div');
            shadowWrapper.className = 'image-wrapper';
            shadowWrapper.appendChild(createImage(item.shadow, 'Schaduw'));
            pairDiv.appendChild(originalWrapper);
            pairDiv.appendChild(shadowWrapper);
            werkbladWeergave.appendChild(pairDiv);
        });
    }

    function renderTwoColumnWorksheet() {
        werkbladWeergave.innerHTML = '';
        werkbladWeergave.className = 'werkblad-container-final';
        const objectenKolom = document.createElement('div');
        objectenKolom.className = 'kolom';
        const schaduwenKolom = document.createElement('div');
        schaduwenKolom.className = 'kolom';
        const geschuddeObjecten = shuffleArray([...generatedItems]);
        const geschuddeSchaduwen = shuffleArray([...generatedItems]);
        geschuddeObjecten.forEach(item => objectenKolom.appendChild(createItemWrapper(item.original, 'Object')));
        geschuddeSchaduwen.forEach(item => schaduwenKolom.appendChild(createItemWrapper(item.shadow, 'Schaduw')));
        werkbladWeergave.appendChild(objectenKolom);
        werkbladWeergave.appendChild(schaduwenKolom);
    }

    // --- Verfijn-modus Functies ---
    function toggleMoveMode() {
        isMoveModeEnabled = !isMoveModeEnabled;
        werkbladWeergave.classList.toggle('move-mode-active', isMoveModeEnabled);
        enableMoveBtn.classList.toggle('active', isMoveModeEnabled);
        enableMoveBtn.textContent = isMoveModeEnabled ? 'Klaar met verfijnen' : 'Verplaats & Pas Grootte Aan';

        if (isMoveModeEnabled) {
            resizeControls.style.display = 'flex';
        } else {
            resizeControls.style.display = 'none';
            if (selectedItem) {
                selectedItem.classList.remove('selected-for-edit');
                selectedItem = null;
            }
        }
    }

    function makeElementDraggable(element) {
        element.addEventListener('click', () => {
            if (!isMoveModeEnabled) return;
    
            if (selectedItem) {
                selectedItem.classList.remove('selected-for-edit');
            }
    
            selectedItem = element;
            selectedItem.classList.add('selected-for-edit');
    
            const currentSize = selectedItem.offsetWidth;
            sizeFeedback.textContent = `Grootte: ${currentSize}px`;
        });

        element.addEventListener('mousedown', function(e) {
            if (!isMoveModeEnabled) return;
            e.preventDefault();
            element.classList.add('dragging');
            const rect = element.getBoundingClientRect();
            const offsetX = e.clientX - rect.left;
            const offsetY = e.clientY - rect.top;

            function onMouseMove(e) {
                const parentRect = werkbladWeergave.getBoundingClientRect();
                let newLeft = e.clientX - parentRect.left - offsetX;
                let newTop = e.clientY - parentRect.top - offsetY;
                newLeft = Math.max(0, Math.min(newLeft, parentRect.width - element.offsetWidth));
                newTop = Math.max(0, Math.min(newTop, parentRect.height - element.offsetHeight));
                
                element.style.left = newLeft + 'px';
                element.style.top = newTop + 'px';
                
                const originalTransform = element.style.transform;
                const rotationMatch = originalTransform.match(/rotate\((.+?)\)/);
                element.style.transform = rotationMatch ? rotationMatch[0] : '';
            }

            function onMouseUp() {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
                element.classList.remove('dragging');
            }

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
    }

    // --- Hoofd Workflow & Systeemfuncties ---
    function handleFileSelection() {
        ++loadVersion; librarySheet = null; solutionButton.disabled = true; solutionDownload.disabled = true;
        originalFiles = Array.from(imageUpload.files);
        fileFeedback.textContent = `${originalFiles.length} bestand(en) geselecteerd.`;
        if (originalFiles.length > 0) {
            displayOriginalImages();
            createShadowsBtn.disabled = false;
            renderWorksheetBtn.disabled = true;
            werkbladTypeRadios.forEach(radio => radio.disabled = true);
            editControls.style.display = 'none';
        } else {
            resetGenerator();
        }
    }

    async function handleShadowCreation() {
        fileFeedback.textContent = 'Schaduwen worden gemaakt...';
        generatedItems = [];
        const processingPromises = originalFiles.map(createShadowFromBlob);
        generatedItems = await Promise.all(processingPromises);
        displayShadowPairs();
        fileFeedback.textContent = 'Schaduwen zijn gemaakt. Kies een werkbladtype.';
        renderWorksheetBtn.disabled = false;
        werkbladTypeRadios.forEach(radio => radio.disabled = false);
    }

    function renderFinalWorksheet() {
        const selectedType = document.querySelector('input[name="werkbladType"]:checked').value;
        editControls.style.display = 'none';
        if (selectedType === 'type2') {
            renderTwoColumnWorksheet();
        } else {
            kindSelect.value = 'detail';
            cards();
            libraryStatus.textContent = 'Kies een speurblad met speciaal getekende varianten uit de bibliotheek.';
            document.querySelector('.library-panel').scrollIntoView({behavior:'smooth'});
        }
    }

    async function downloadWorksheetAsPDF() {
        const wasMoveMode = isMoveModeEnabled;
        if (wasMoveMode) toggleMoveMode();
        
        const worksheetElement = document.getElementById('werkbladWeergave');
        const pdfFilename = librarySheet ? `schaduw-${librarySheet.theme.id}-${librarySheet.kind}-${librarySheet.variant+1}${showingSolution ? '-oplossing' : ''}.pdf` : 'schaduw-werkblad.pdf';
        if (!worksheetElement.matches('.library-sheet, .werkblad-container-final, .werkblad-type-1-final')) {
            alert("Genereer eerst een werkblad om te downloaden.");
            if (wasMoveMode) toggleMoveMode();
            return;
        }
        try {
            const canvas = await html2canvas(worksheetElement, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
            const imgData = canvas.toDataURL('image/png');
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const pageW = pdf.internal.pageSize.getWidth();
            const pageH = pdf.internal.pageSize.getHeight();
            const margin = 10;
            const availableW = pageW - margin * 2;
            const availableH = pageH - margin * 2;
            const imgProps = pdf.getImageProperties(imgData);
            const imgRatio = imgProps.width / imgProps.height;
            let pdfImgW = availableW;
            let pdfImgH = pdfImgW / imgRatio;
            if (pdfImgH > availableH) {
                pdfImgH = availableH;
                pdfImgW = pdfImgH * imgRatio;
            }
            const x = (pageW - pdfImgW) / 2;
            const y = (pageH - pdfImgH) / 2;
            pdf.addImage(imgData, 'PNG', x, y, pdfImgW, pdfImgH);
            pdf.save(pdfFilename);
        } catch (error) {
            console.error("Fout bij het maken van de PDF:", error);
            alert("Er is een fout opgetreden bij het maken van de PDF.");
        } finally {
            if (wasMoveMode) toggleMoveMode();
        }
    }

    function createShadowFromBlob(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = async () => {
                    const originalDataURL = e.target.result;
                    const shadowDataURL = await convertImageToShadow(img);
                    resolve({ original: originalDataURL, shadow: shadowDataURL });
                };
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    function convertImageToShadow(imgElement) {
        const ctx = hiddenCanvas.getContext('2d');
        hiddenCanvas.width = imgElement.naturalWidth;
        hiddenCanvas.height = imgElement.naturalHeight;
        ctx.clearRect(0, 0, hiddenCanvas.width, hiddenCanvas.height);
        ctx.drawImage(imgElement, 0, 0);
        const imageData = ctx.getImageData(0, 0, hiddenCanvas.width, hiddenCanvas.height);
        const pixels = imageData.data;
        for (let i = 0; i < pixels.length; i += 4) {
            if (pixels[i + 3] > 50) {
                pixels[i] = 0; pixels[i + 1] = 0; pixels[i + 2] = 0; pixels[i + 3] = 255;
            } else {
                pixels[i + 3] = 0;
            }
        }
        ctx.putImageData(imageData, 0, 0);
        return Promise.resolve(hiddenCanvas.toDataURL('image/png'));
    }

    function resetGenerator() {
        ++loadVersion;
        librarySheet = null;
        solutionButton.disabled = true;
        solutionDownload.disabled = true;
        solutionButton.textContent = 'Toon oplossing';
        originalFiles = [];
        generatedItems = [];
        isMoveModeEnabled = false;
        selectedItem = null;
        imageUpload.value = '';
        werkbladWeergave.innerHTML = '<p class="placeholder-text">Begin bij Stap 1 om afbeeldingen te kiezen.</p>';
        werkbladWeergave.className = '';
        fileFeedback.textContent = 'Geen bestanden geselecteerd.';
        createShadowsBtn.disabled = true;
        renderWorksheetBtn.disabled = true;
        editControls.style.display = 'none';
        werkbladTypeRadios.forEach(radio => {
            radio.disabled = true;
            radio.checked = radio.value === 'type2';
        });
    }

    // --- Functies voor Resizen ---
    function resizeSelectedItem(amount) {
        if (!selectedItem) {
            alert("Selecteer eerst een schaduw door erop te klikken.");
            return;
        }

        const currentWidth = selectedItem.offsetWidth;
        const currentHeight = selectedItem.offsetHeight;
        const newWidth = currentWidth + amount;
        const newHeight = currentHeight + amount;

        if (newWidth < 20 || newHeight < 20) {
            sizeFeedback.textContent = "Minimale grootte bereikt";
            return;
        }

        selectedItem.style.width = newWidth + 'px';
        selectedItem.style.height = newHeight + 'px';
        
        sizeFeedback.textContent = `Grootte: ${newWidth}px`;
    }

    // --- Event Listeners ---
    uploadTriggerBtn.addEventListener('click', () => imageUpload.click());
    imageUpload.addEventListener('change', handleFileSelection);
    createShadowsBtn.addEventListener('click', handleShadowCreation);
    renderWorksheetBtn.addEventListener('click', renderFinalWorksheet);
    resetBtn.addEventListener('click', resetGenerator);
    downloadPdfBtn.addEventListener('click', downloadWorksheetAsPDF);
    enableMoveBtn.addEventListener('click', toggleMoveMode);
    increaseSizeBtn.addEventListener('click', () => resizeSelectedItem(10));
    decreaseSizeBtn.addEventListener('click', () => resizeSelectedItem(-10));
    // Vaste themabladen: dezelfde keuze geeft steeds hetzelfde werkblad.
    const assetRoot = /\/(pro|ontdek)\//.test(location.pathname) ? '../' : '';
    const themeSelect = document.getElementById('library-theme');
    const kindSelect = document.getElementById('library-kind');
    const solutionButton = document.getElementById('library-solution');
    const libraryStatus = document.getElementById('library-status');
    const solutionDownload = document.getElementById('downloadSolutionPdfBtn');
    let librarySheet = null;
    let showingSolution = false;
    let loadVersion = 0;
    for (const theme of window.SCHADUW_THEMAS) themeSelect.add(new Option(theme.label, theme.id));
    function cards() {
        ++loadVersion;
        const theme = window.SCHADUW_THEMAS.find(t => t.id === themeSelect.value);
        document.getElementById('library-cards').replaceChildren();
        libraryStatus.textContent = kindSelect.value === 'match' ? '15 verbindbladen met 6, 8 of 10 paren. De 6-parenbladen hebben grotere afbeeldingen voor kleuters.' : kindSelect.value === 'mixed' ? '15 verbindbladen met 6, 8, 10 of 12 paren. De 6-parenbladen hebben grotere afbeeldingen voor kleuters.' : (kindSelect.value === 'detail-fine' ? 'Moeilijker: dezelfde tekening en houding, met kleine verschillen aan de omtrek. Eén schaduw klopt precies.' : 'Makkelijk: hetzelfde figuurtje in verschillende houdingen. Eén schaduw klopt precies.');
        const sheets = Array.from({length: kindSelect.value.startsWith('detail') ? 1 : 15}, (_, index) => ({
            index,
            count: index >= 12 ? 6 : kindSelect.value === 'match' ? [8, 10][index % 2] : Math.min([8, 10, 12][index % 3], theme.images.length)
        }));
        if (!kindSelect.value.startsWith('detail')) sheets.sort((a,b) => a.count-b.count || a.index-b.index);
        sheets.forEach(({count, index}) => {
            const button = document.createElement('button');
            button.className = 'library-card';
            const previewPool = kindSelect.value === 'mixed' ? theme.images : kindSelect.value === 'match' ? theme.matchImages : kindSelect.value === 'detail-fine' ? theme.fineImages : theme.circleImages;
            const img = createImage(assetRoot + previewPool[index % previewPool.length], '');
            const text = document.createElement('span');
            text.textContent = kindSelect.value.startsWith('detail') ? `Speurblad · ${previewPool.length} verschillende schaduwen · ${kindSelect.value === "detail-fine" ? "kleine verschillen" : "houdingen"}` : `Werkblad ${index + 1} · ${count} paren${count === 6 ? " · kleuters" : ""}`;
            button.append(img, text);
            button.onclick = () => loadLibrarySheet(theme, count, index);
            document.getElementById('library-cards').append(button);
        });
    }
    async function loadLibrarySheet(theme, count, variant) {
        const version = ++loadVersion;
        libraryStatus.textContent = 'Werkblad wordt klaargezet…';
        try {
            const pool = kindSelect.value === 'match' ? theme.matchImages : theme.images;
            const urls = kindSelect.value.startsWith('detail') ? (kindSelect.value === 'detail-fine' ? theme.fineImages : theme.circleImages) : Array.from({length: count}, (_, i) => pool[(variant * 3 + i) % pool.length]);
            if (kindSelect.value.startsWith('detail') && (urls.length !== 14 || new Set(urls).size !== 14)) throw new Error('Een speurblad vereist 14 verschillende afbeeldingen.');
            const images = await Promise.all(urls.map(url => new Promise((resolve, reject) => {
                const img = new Image(); img.onload = () => resolve(img); img.onerror = reject; img.src = assetRoot + url;
            })));
            if (version !== loadVersion) return;
            if (kindSelect.value.startsWith('detail')) validateCircleShapes(images);
            resetGenerator();
            librarySheet = {theme, images, count, variant, kind: kindSelect.value};
            showingSolution = false;
            solutionButton.disabled = false;
            solutionDownload.disabled = false;
            drawLibrarySheet();
            libraryStatus.textContent = `${theme.label}: je werkblad staat klaar. Download het als PDF.`;
        } catch (error) { if(version === loadVersion) libraryStatus.textContent = 'De afbeeldingen konden niet geladen worden. Probeer opnieuw.'; }
    }
    function drawContained(ctx, img, x, y, width, height) {
        const scale = Math.min(width / img.width, height / img.height);
        const w = img.width * scale, h = img.height * scale;
        ctx.drawImage(img, x + (width-w)/2, y + (height-h)/2, w, h);
    }
    function silhouette(img) {
        const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
        const x = c.getContext('2d');
        x.drawImage(img, 0, 0);
        x.globalCompositeOperation = 'source-in'; x.fillStyle = '#000'; x.fillRect(0,0,c.width,c.height);
        return c;
    }
    function validateCircleShapes(images) {
        const outlines = new Set();
        images.forEach(img => {
            const canvas = document.createElement('canvas'); canvas.width=160; canvas.height=160;
            const ctx=canvas.getContext('2d'); drawContained(ctx,img,0,0,160,160);
            const pixels=ctx.getImageData(0,0,160,160).data;
            let outline=''; for(let i=3;i<pixels.length;i+=4) outline+=pixels[i]>128?'1':'0';
            if(outlines.has(outline)) throw new Error('Een schaduwvorm komt dubbel voor.');
            outlines.add(outline);
        });
    }
    function matchingOrder(count, seed) {
        const random = () => { seed = (Math.imul(seed,1664525)+1013904223) >>> 0; return seed / 4294967296; };
        let order;
        do {
            order = Array.from({length:count},(_,i)=>i);
            for(let i=count-1;i>0;i--) { const j=Math.floor(random()*(i+1)); [order[i],order[j]]=[order[j],order[i]]; }
        } while(order.some((value,index)=>value===index));
        return order;
    }
    function drawLibrarySheet() {
        const s = librarySheet;
        werkbladWeergave.className = 'library-sheet'; werkbladWeergave.replaceChildren();
        const c = document.createElement('canvas'); c.width = 794; c.height = 1123; c.setAttribute('aria-label', `${s.theme.label} — ${showingSolution ? 'oplossing' : 'schaduwwerkblad'}`);
        werkbladWeergave.append(c);
        const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0,0,794,1123);
        x.strokeStyle = '#17324a'; x.lineWidth = 2; x.strokeRect(48,16,698,44);
        x.fillStyle = '#17324a'; x.font = 'bold 27px Arial'; x.textAlign = 'center';
        x.fillText(s.theme.label + (showingSolution ? ' · oplossing' : ''),397,47,674); x.textAlign = 'left';
        x.font = '16px Arial'; x.fillText('Naam: __________________________     Datum: ______________',48,105);
        x.font = 'bold 19px Arial'; x.fillText(!s.kind.startsWith('detail') ? 'Verbind elk plaatje met de juiste schaduw.' : 'Omcirkel de juiste schaduw.',48,149);
        x.font = '15px Arial';
        if(!s.kind.startsWith('detail')) {
            // Een vaste geschudde volgorde zonder paren recht tegenover elkaar.
            const order = matchingOrder(s.count, s.variant + s.theme.id.split('').reduce((a,c)=>a+c.charCodeAt(0),0));
            const height = 887/s.count;
            s.images.forEach((img,i)=>{
                const size = s.count === 6 ? height-10 : Math.min(height-25,112), top = 170 + i*height;
                const width = s.count === 6 ? 174 : 132;
                drawContained(x,img,171-width/2,top,width,size);
                x.fillStyle='#17324a';
                x.beginPath(); x.arc(255,top+size/2,3,0,Math.PI*2); x.fill();
                x.beginPath(); x.arc(535,top+size/2,3,0,Math.PI*2); x.fill();
                const shadow=silhouette(s.images[order[i]]);
                drawContained(x,shadow,616-width/2,top,width,size);
                if(showingSolution) { const dest=order.indexOf(i); x.strokeStyle='#24865b'; x.lineWidth=2; x.beginPath(); x.moveTo(255,top+size/2); x.lineTo(535,170+dest*height+size/2); x.stroke(); }
            });
        } else {
            x.font='15px Arial'; x.fillText('Welke schaduw hoort precies bij het gekleurde plaatje in het midden?',48,184);
            const allPositions=[[125,285],[365,270],[650,300],
                [245,445],[520,420],[112,610],[682,585],
                [160,785],[625,770],[365,825],
                [110,970],[300,985],[490,960],[680,980]];
            drawContained(x,s.images[0],297,485,200,200);

            // Elke afbeelding precies één keer: één juiste schaduw en unieke afleiders.
            const around = allPositions.slice().sort((a,b)=>Math.atan2(a[1]-585,a[0]-397)-Math.atan2(b[1]-585,b[0]-397));
            const positions = s.images.map((_,i)=>around[Math.floor(i*around.length/s.images.length)]);
            const order=matchingOrder(s.images.length,s.variant+143);
            positions.forEach(([cx,cy],i)=>{
                const imageIndex = order[i];
                const shape = silhouette(s.images[imageIndex]);
                const size = [150,160,154,158][i%4];
                const angle = imageIndex === 0 ? 0 : [-12,8,-7,14,-9,0,10,-13,6,-8,12,-5,9,-11][i] * Math.PI/180;
                x.save(); x.translate(cx,cy); x.rotate(angle);
                drawContained(x,shape,-size/2,-size/2,size,size);
                x.restore();

                if(showingSolution && imageIndex===0){x.strokeStyle='#24865b';x.lineWidth=3;x.beginPath();x.ellipse(cx,cy,87,91,0,0,Math.PI*2);x.stroke();}
            }); x.textAlign='left';
        }
        x.fillStyle='#667b8c';x.font='13px Arial';x.fillText('Juf Zisa · Schaduwen · '+(s.variant+1),48,1085);
        solutionButton.textContent=showingSolution ? 'Toon werkblad' : 'Toon oplossing';
    }
    themeSelect.addEventListener('change',cards);kindSelect.addEventListener('change',cards);
    solutionButton.addEventListener('click',()=>{if(librarySheet){showingSolution=!showingSolution;drawLibrarySheet();}});
    solutionDownload.addEventListener('click',async()=>{
        if(!librarySheet) return;
        const target=librarySheet, previous=showingSolution;
        showingSolution=true;drawLibrarySheet();solutionDownload.disabled=true;
        try { await downloadWorksheetAsPDF(); } finally {
            if(librarySheet===target) {showingSolution=previous;drawLibrarySheet();solutionDownload.disabled=false;}
        }
    });
    cards();
});
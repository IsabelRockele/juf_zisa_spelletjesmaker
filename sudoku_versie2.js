'use strict';
const sudokuImageBase = new URL('sudoku_afbeeldingen/', document.currentScript.src);
document.addEventListener('DOMContentLoaded', () => {
    const { GRID_SPECS, shuffle, createSudokuWithDifficulty, planPages } = window.SudokuV2;
    const $ = id => document.getElementById(id);
    const canvas = $('mainCanvas');
    const type = () => document.querySelector('[name="sudokuType"]:checked').value;
    const variety = () => document.querySelector('[name="imageVariety"]:checked').value;
    const size = () => Number($('gridSizeSelect').value);
    const count = () => Number($('aantalSudokus').value);
    const themeCount = () => window.SUDOKU_THEME_COUNTS?.[$('themeSelect').value] || 20;
    const needed = () => size() * (variety() === 'different' ? count() : 1);
    const downloadButtons = ['downloadPngBtn', 'downloadPdfBtn', 'toggleSolutionsBtn', 'downloadSolutionsPdfBtn'];
    let themeImages = [], selectedImages = [], uploads = [];
    let worksheet = null, pages = [], pageIndex = 0, showingSolutions = false;
    let sourceRevision = 0, generationRevision = 0, loadingImages = false, generating = false;
    let sourceError = '';

    function message(text, error = false) {
        $('meldingContainer').textContent = text;
        $('meldingContainer').style.color = error ? '#a32121' : '#17476d';
    }
    function ready() {
        return type() === 'getallen' || (!loadingImages && !sourceError &&
            ($('themeSelect').value ? selectedImages.length === needed() : uploads.length >= needed()));
    }
    function invalidate() {
        generationRevision++;
        generating = false;
        worksheet = null; pages = []; pageIndex = 0; showingSolutions = false;
        canvas.width = 840; canvas.height = 1188;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#526b82'; ctx.font = '24px Arial'; ctx.textAlign = 'center';
        ctx.fillText('Kies je instellingen en afbeeldingen.', 420, 140);
        updateButtons();
    }
    function updateButtons() {
        canvas.dataset.pageCount = String(pages.length);
        downloadButtons.forEach(id => { $(id).disabled = !worksheet || generating || (type() === 'afbeeldingen' && loadingImages); });
        $('genereerBtn').disabled = !ready() || generating;
        $('confirmThemeImagesBtn').disabled = !ready() || generating;
        $('autoThemeImagesBtn').disabled = loadingImages || generating || themeImages.length < needed();
        $('toggleSolutionsBtn').textContent = showingSolutions ? 'Terug naar werkblad' : 'Oplossingen tonen';
        $('downloadPdfBtn').textContent = showingSolutions ? '↓ PDF oplossingen' : '↓ PDF werkblad';
        $('previousPageBtn').disabled = pageIndex <= 0 || !pages.length;
        $('nextPageBtn').disabled = pageIndex >= pages.length - 1;
        $('pageIndicator').textContent = pages.length ? `Pagina ${pageIndex + 1} van ${pages.length}` : 'Nog geen werkblad';
        $('previewStatus').textContent = pages.length
            ? `${pages.length} pagina${pages.length === 1 ? '' : "’s"}. PDF en PNG bevatten alle pagina’s van deze weergave.` : '';
        $('main-content').setAttribute('aria-busy', String(generating || loadingImages));
    }
    function updateUi() {
        const images = type() === 'afbeeldingen';
        $('imageSettings').hidden = !images;
        const theme = $('themeSelect').value;
        const different = document.querySelector('[name="imageVariety"][value="different"]');
        const impossible = images && Boolean(theme) && size() * count() > themeCount();
        different.disabled = impossible;
        if (impossible && different.checked) document.querySelector('[name="imageVariety"][value="same"]').checked = true;
        selectedImages = selectedImages.slice(0, needed());
        $('themeSelectionGroup').style.display = images ? 'flex' : 'none';
        $('image-variety-controls').style.display = images && count() > 1 ? 'flex' : 'none';
        $('themeImageSelection').style.display = images && theme ? 'flex' : 'none';
        $('image-controls').style.display = images && !theme ? 'block' : 'none';
        $('varietyHint').textContent = impossible
            ? `Dit thema bevat ${themeCount()} afbeeldingen. Voor deze combinatie gebruiken we dezelfde afbeeldingen. Kies minder sudoku’s of upload eigen afbeeldingen voor aparte sets.` : '';
        $('aantalMelding').textContent = (size() === 4
            ? 'Tot 4 sudoku’s op een roosterpagina.'
            : 'Eén sudoku per roosterpagina.') + (images ? ' Knipstroken komen op extra pagina’s.' : '');
        $('themeImageSelectionLabel').textContent = `Kies ${needed()} afbeeldingen uit het thema (${selectedImages.length} geselecteerd):`;
        $('imageInputLabel').textContent = `Upload minstens ${needed()} verschillende afbeeldingen:`;
        if (images && loadingImages) message('Afbeeldingen laden…');
        else if (images && sourceError) message(sourceError, true);
        else if (images && !ready()) {
            const amount = theme ? selectedImages.length : uploads.length;
            message(`Nog ${Math.max(0, needed()-amount)} afbeeldingen nodig.`, true);
        } else if (!generating) message(images ? 'Afbeeldingen klaar. Je kunt een nieuwe sudoku maken.' : '');
        renderImageChoices(); updateButtons();
    }
    function renderImageChoices() {
        const choices = $('selectableThemeImagePreviews');
        const scrollTop = choices.scrollTop;
        const focusedIndex = Array.from(choices.children).indexOf(document.activeElement);
        $('selectableThemeImagePreviews').replaceChildren(); $('image-previews').replaceChildren();
        const theme = $('themeSelect').value;
        const parent = theme ? $('selectableThemeImagePreviews') : $('image-previews');
        (theme ? themeImages : uploads).forEach((img, index) => {
            const wrapper = document.createElement(theme ? 'button' : 'div');
            wrapper.className = 'theme-image-wrapper';
            const chosen = selectedImages.includes(img);
            if (chosen) wrapper.classList.add('selected');
            const preview = document.createElement('img');
            preview.src = img.src; preview.alt = `Afbeelding ${index + 1}`;
            wrapper.appendChild(preview); parent.appendChild(wrapper);
            if (theme) {
                wrapper.type = 'button'; wrapper.setAttribute('aria-pressed', String(chosen));
                wrapper.addEventListener('click', () => {
                    if (!chosen && selectedImages.length >= needed()) return;
                    selectedImages = chosen ? selectedImages.filter(value => value !== img) : [...selectedImages, img];
                    invalidate(); updateUi();
                });
            }
        });
        if (focusedIndex >= 0) choices.children[focusedIndex]?.focus({ preventScroll: true });
        choices.scrollTop = scrollTop;
    }
    function loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => img.naturalWidth > 0 ? resolve(img) : reject(new Error('Lege afbeelding'));
            img.onerror = () => reject(new Error('Afbeelding kon niet worden geladen'));
            img.src = src;
        });
    }
    function readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('Bestand kon niet worden gelezen'));
            reader.onabort = () => reject(new Error('Bestand lezen afgebroken'));
            reader.readAsDataURL(file);
        });
    }
    async function changeTheme() {
        const revision = ++sourceRevision;
        const theme = $('themeSelect').value;
        themeImages = []; selectedImages = []; sourceError = ''; loadingImages = Boolean(theme);
        invalidate(); updateUi();
        if (!theme) { loadingImages = false; updateUi(); if (ready()) await generate(); return; }
        try {
            const results = await Promise.all(Array.from({length: themeCount()}, (_, i) =>
                loadImage(new URL(`${theme}/${String(i+1).padStart(2, '0')}.png`, sudokuImageBase).href)));
            if (revision !== sourceRevision) return;
            themeImages = results;
        } catch (error) {
            if (revision !== sourceRevision) return;
            sourceError = 'Dit thema kon niet worden geladen. Kies het thema opnieuw via de lege keuze, of kies een ander thema.';
        } finally {
            if (revision === sourceRevision) { loadingImages = false; updateUi(); }
        }
    }
    async function uploadFiles(event) {
        const files = Array.from(event.target.files);
        if (!files.length) return;
        const revision = ++sourceRevision;
        uploads = []; sourceError = ''; loadingImages = true;
        invalidate(); updateUi();
        try {
            const urls = [...new Set(await Promise.all(files.map(readFile)))];
            const loaded = await Promise.all(urls.map(loadImage));
            if (revision !== sourceRevision) return;
            uploads = loaded;
        } catch (error) {
            if (revision !== sourceRevision) return;
            sourceError = 'Een bestand is geen leesbare afbeelding. Kies de afbeeldingen opnieuw.';
        } finally {
            if (revision === sourceRevision) {
                loadingImages = false; $('imageInput').value = ''; updateUi();
                if (ready()) await generate();
            }
        }
    }
    async function generate() {
        if (!ready()) { invalidate(); updateUi(); return; }
        const revision = ++generationRevision;
        generating = true; updateButtons(); message('Sudoku’s maken en oplossingen controleren…');
        await new Promise(resolve => setTimeout(resolve, 0));
        if (revision !== generationRevision) return;
        try {
            const config = { size: size(), type: type(), difficulty: $('difficulty').value, puzzles: [] };
            const amount = count();
            const source = $('themeSelect').value ? selectedImages : uploads;
            const separate = variety() === 'different';
            for (let i = 0; i < amount; i++) {
                const { puzzle, solution } = createSudokuWithDifficulty(config.size, config.difficulty);
                const offset = separate ? i*config.size : 0;
                const images = config.type === 'afbeeldingen' ? source.slice(offset, offset+config.size) : [];
                const missing = [];
                puzzle.forEach((row, r) => row.forEach((value, c) => { if (!value) missing.push(solution[r][c]); }));
                shuffle(missing);
                config.puzzles.push({ puzzle, solution, images, missing });
                await new Promise(resolve => setTimeout(resolve, 0));
                if (revision !== generationRevision) return;
            }
            worksheet = config; showingSolutions = false; pageIndex = 0;
            pages = planPages(worksheet); renderPreview();
            message('Werkblad klaar. Druk af op ware grootte (100%) zodat de knipplaatjes passen.');
        } catch (error) {
            invalidate(); message('Het werkblad kon niet worden gemaakt. Probeer opnieuw.', true);
            console.error(error);
        } finally {
            if (revision === generationRevision) { generating = false; updateButtons(); }
        }
    }
    function drawImage(ctx, image, x, y, side) {
        const ratio = Math.min(side/image.naturalWidth, side/image.naturalHeight);
        const w = image.naturalWidth*ratio, h = image.naturalHeight*ratio;
        ctx.drawImage(image, x+(side-w)/2, y+(side-h)/2, w, h);
    }
    function drawGrid(ctx, item, showSolutions) {
        const { index, x, y, side } = item;
        const data = worksheet.puzzles[index], n = worksheet.size, cell = side/n;
        const grid = showSolutions ? data.solution : data.puzzle;
        ctx.fillStyle = '#17476d'; ctx.font = 'bold 3.8px Arial'; ctx.textAlign = 'left';
        ctx.fillText(`Sudoku ${index+1}`, x, y-4);
        for (let r=0; r<n; r++) for (let c=0; c<n; c++) {
            const value = grid[r][c]; if (!value) continue;
            const added = showSolutions && data.puzzle[r][c] === 0;
            const cx = x+c*cell, cy = y+r*cell;
            if (worksheet.type === 'getallen') {
                ctx.fillStyle = added ? '#16834f' : '#111'; ctx.font = `${cell*0.55}px Arial`;
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText(String(value), cx+cell/2, cy+cell/2);
                ctx.textBaseline = 'alphabetic';
            } else {
                drawImage(ctx, data.images[value-1], cx+cell*0.12, cy+cell*0.12, cell*0.76);
                if (added) { ctx.strokeStyle = '#16834f'; ctx.lineWidth = 0.6; ctx.strokeRect(cx+1,cy+1,cell-2,cell-2); }
            }
        }
        const spec = GRID_SPECS[n]; ctx.strokeStyle = '#17476d';
        for (let i=0; i<=n; i++) {
            ctx.lineWidth = i%spec.blockCols === 0 ? 0.7 : 0.22;
            ctx.beginPath(); ctx.moveTo(x+i*cell,y); ctx.lineTo(x+i*cell,y+side); ctx.stroke();
            ctx.lineWidth = i%spec.blockRows === 0 ? 0.7 : 0.22;
            ctx.beginPath(); ctx.moveTo(x,y+i*cell); ctx.lineTo(x+side,y+i*cell); ctx.stroke();
        }
    }
    function renderPage(page, index, total, target = document.createElement('canvas'), scale = 4) {
        target.width = 210*scale; target.height = 297*scale;
        const ctx = target.getContext('2d'); ctx.scale(scale,scale);
        ctx.fillStyle = '#fff'; ctx.fillRect(0,0,210,297);
        ctx.fillStyle = '#17476d'; ctx.font = '3.5px Arial'; ctx.textAlign = 'left';
        ctx.fillText('Naam: __________________________',10,14);
        ctx.fillText('Datum: _______________',135,14);
        const cuts = page.kind === 'cuts';
        ctx.font = 'bold 6px Arial'; ctx.textAlign = 'center';
        ctx.fillText(cuts ? 'KNIPSTROKEN SUDOKU' : page.solutions ? 'OPLOSSINGEN SUDOKU' : 'SUDOKU',105,25);
        ctx.font = '3.5px Arial'; ctx.fillStyle = '#43566b';
        ctx.fillText(cuts ? 'Knip de plaatjes uit en plak ze bij de juiste sudoku.' : page.solutions
            ? 'De aangevulde vakjes zijn groen gemarkeerd.'
            : `Elk ${worksheet.type === 'getallen' ? 'getal' : 'plaatje'} komt één keer voor in elke rij, kolom en elk dik omlijnd blok.`,105,33);
        if (cuts) {
            for (const section of page.sections) {
                const data = worksheet.puzzles[section.index];
                ctx.textAlign = 'left'; ctx.font = 'bold 4px Arial'; ctx.fillStyle = '#17476d';
                ctx.fillText(`Voor sudoku ${section.index+1}`,section.x,section.y+4);
                data.missing.forEach((value,i) => {
                    const x = section.x+(i%section.columns)*(section.cell+3);
                    const y = section.y+10+Math.floor(i/section.columns)*(section.cell+3);
                    ctx.strokeStyle = '#526b82'; ctx.lineWidth = 0.25; ctx.setLineDash([1,1]);
                    ctx.strokeRect(x,y,section.cell,section.cell); ctx.setLineDash([]);
                    drawImage(ctx,data.images[value-1],x+section.cell*0.12,y+section.cell*0.12,section.cell*0.76);
                });
            }
        } else page.grids.forEach(grid => drawGrid(ctx,grid,page.solutions));
        ctx.fillStyle = '#526b82'; ctx.font = '3px Arial'; ctx.textAlign = 'left';
        ctx.fillText('Afdrukken op ware grootte (100%).',10,290);
        ctx.textAlign = 'right'; ctx.fillText(`Pagina ${index+1} van ${total}`,200,290);
        return target;
    }
    function renderPreview() {
        if (!worksheet || !pages.length) return;
        renderPage(pages[pageIndex],pageIndex,pages.length,canvas); updateButtons();
    }
    function saveBlob(blob, filename) {
        const url = URL.createObjectURL(blob), a = document.createElement('a');
        a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 60000);
    }
    function downloadPng() {
        if (!worksheet || generating) return;
        // Eén bestand voorkomt dat de browser meerdere downloads blokkeert.
        const combined = document.createElement('canvas');
        const filename = `sudoku-${showingSolutions ? 'oplossingen' : 'werkblad'}-alle-paginas.png`;
        const scale = 3, height = 297*scale;
        combined.width = 210*scale; combined.height = height*pages.length;
        const ctx = combined.getContext('2d');
        pages.forEach((page,i) => ctx.drawImage(renderPage(page,i,pages.length,undefined,scale),0,i*height));
        combined.toBlob(blob => {
            if (blob) saveBlob(blob,filename);
            else message('PNG maken is mislukt. Probeer PDF.',true);
        },'image/png');
    }
    function downloadPdf(solutions = showingSolutions) {
        if (!worksheet || generating) return;
        try {
            if (!window.jspdf?.jsPDF) throw new Error('PDF-bibliotheek niet geladen');
            const exported = planPages(worksheet,solutions);
            const doc = new window.jspdf.jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
            exported.forEach((page,i) => {
                if (i) doc.addPage();
                doc.addImage(renderPage(page,i,exported.length),'PNG',0,0,210,297,undefined,'FAST');
            });
            doc.save(`sudoku-${solutions ? 'oplossingen' : 'werkblad'}-${worksheet.size}x${worksheet.size}.pdf`);
        } catch (error) { message('PDF maken is mislukt. Vernieuw de pagina en probeer opnieuw.',true); console.error(error); }
    }
    document.querySelectorAll('[name="sudokuType"], [name="imageVariety"], #gridSizeSelect, #aantalSudokus, #difficulty').forEach(el => {
        el.addEventListener('change', () => { invalidate(); updateUi(); if (ready()) generate(); });
    });
    $('themeSelect').addEventListener('change',changeTheme);
    $('imageInput').addEventListener('change',uploadFiles);
    $('clearImagesBtn').addEventListener('click', () => {
        sourceRevision++; uploads = []; sourceError = ''; loadingImages = false; $('imageInput').value = '';
        invalidate(); updateUi();
    });
    $('genereerBtn').addEventListener('click',generate);
    $('confirmThemeImagesBtn').addEventListener('click',generate);
    $('autoThemeImagesBtn').addEventListener('click', () => {
        if (loadingImages || themeImages.length < needed()) return;
        selectedImages = shuffle([...themeImages]).slice(0, needed());
        invalidate(); updateUi(); generate();
    });
    $('toggleSolutionsBtn').addEventListener('click', () => {
        if (!worksheet) return;
        showingSolutions = !showingSolutions; pages = planPages(worksheet,showingSolutions); pageIndex = 0; renderPreview();
    });
    $('downloadPngBtn').addEventListener('click',downloadPng);
    $('downloadPdfBtn').addEventListener('click', () => downloadPdf());
    $('downloadSolutionsPdfBtn').addEventListener('click', () => downloadPdf(true));
    $('previousPageBtn').addEventListener('click', () => { if (pageIndex > 0) { pageIndex--; renderPreview(); } });
    $('nextPageBtn').addEventListener('click', () => { if (pageIndex+1 < pages.length) { pageIndex++; renderPreview(); } });
    updateUi(); generate();
});

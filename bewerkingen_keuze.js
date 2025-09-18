document.addEventListener("DOMContentLoaded", () => {
    // --- Algemene Elementen ---
    const selectAllTafelsCheckbox = document.getElementById('selectAllTafels');
    const tafelKeuzeDiv = document.getElementById('tafelKeuze');

    // --- Vul de tafel-checkboxes ---
    if (tafelKeuzeDiv) {
        for (let i = 1; i <= 12; i++) {
            const label = document.createElement('label');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.name = 'tafelNummer';
            checkbox.value = i;
            // NIEUW: standaard NIET aangevinkt
            checkbox.checked = false;

            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(` ${i}`));
            tafelKeuzeDiv.appendChild(label);
        }
    }
    // Zorg dat "Alles selecteren" bij start ook uit staat
    if (selectAllTafelsCheckbox) selectAllTafelsCheckbox.checked = false;

    const tafelCheckboxes = document.querySelectorAll('input[name="tafelNummer"]');
    if (selectAllTafelsCheckbox) {
        selectAllTafelsCheckbox.addEventListener('change', (e) => {
            tafelCheckboxes.forEach(cb => cb.checked = e.target.checked);
        });
    }

    // --- Logica voor Vak 1: Splitsen ---
    const maakSplitsBtn = document.getElementById('maakSplitsBtn');
    const groteSplitshuizenCheckbox = document.getElementById('groteSplitshuizenCheckbox');
    const numOefeningenSplitsDiv = document.getElementById('numOefeningenSplitsDiv');
    const splitsStijlDiv = document.getElementById('splitsStijlDiv');
    const splitsSomCheckbox = document.getElementById('splitsSomCheckbox');
    const splitsMelding = document.getElementById('splitsMelding');

    if (groteSplitshuizenCheckbox) {
        groteSplitshuizenCheckbox.addEventListener('change', () => {
            const isGrootHuis = groteSplitshuizenCheckbox.checked;
            if (numOefeningenSplitsDiv) numOefeningenSplitsDiv.style.display = isGrootHuis ? 'none' : '';
            if (splitsStijlDiv) splitsStijlDiv.style.display = isGrootHuis ? 'none' : '';
            if (splitsSomCheckbox) {
                splitsSomCheckbox.disabled = isGrootHuis;
                if (isGrootHuis) splitsSomCheckbox.checked = false;
            }
        });
    }

    if (maakSplitsBtn) {
        maakSplitsBtn.addEventListener('click', () => {
            if (splitsMelding) splitsMelding.textContent = '';
            const gekozenGetallen = Array.from(document.querySelectorAll('input[name="splitsGetal"]:checked')).map(cb => parseInt(cb.value));

            if (gekozenGetallen.length === 0) {
                if (splitsMelding) splitsMelding.textContent = "Kies minstens één getal om te splitsen.";
                return;
            }

            const settings = {
                hoofdBewerking: 'splitsen',
                groteSplitshuizen: !!(groteSplitshuizenCheckbox && groteSplitshuizenCheckbox.checked),
                splitsGetallenArray: gekozenGetallen,
                splitsWissel: !!(document.getElementById('splitsWisselCheckbox') && document.getElementById('splitsWisselCheckbox').checked),
                splitsSom: !!(splitsSomCheckbox && splitsSomCheckbox.checked),
                numOefeningen: parseInt((document.getElementById('numOefeningen_splits') || { value: 20 }).value),
                splitsStijl: (document.querySelector('input[name="splitsStijl"]:checked') || { value: 'huisje' }).value,
            };
            stuurDoor(settings);
        });
    }

    // --- NIEUW: Hulpmiddelen UI voor bewerkingen (+, -) ---
    const rekenHulpCheckbox = document.getElementById('rekenHulpCheckbox');
    const rekenHulpDetail = document.getElementById('rekenHulpDetail');
    const aftrekkenHint = document.getElementById('aftrekkenHint');
    const optellenHint = document.getElementById('optellenHint');

    const rekenTypeRadios = document.querySelectorAll('input[name="rekenType"]');
    const rekenBrugSelect = document.getElementById('rekenBrug');
    const rekenHulpSchrijflijnen = document.getElementById('rekenHulpSchrijflijnen');

    function updateHulpWeergave() {
        if (!rekenBrugSelect || !rekenHulpCheckbox || !rekenHulpDetail) return;

        const type = (document.querySelector('input[name="rekenType"]:checked') || {}).value || 'optellen';
        const brug = rekenBrugSelect.value;

        const hulpMogelijk = brug !== 'zonder' && rekenHulpCheckbox.checked;
        rekenHulpDetail.style.display = hulpMogelijk ? '' : 'none';

        if (hulpMogelijk) {
            if (type === 'aftrekken') {
                if (aftrekkenHint) aftrekkenHint.style.display = '';
                if (optellenHint) optellenHint.style.display = 'none';
            } else if (type === 'optellen') {
                if (aftrekkenHint) aftrekkenHint.style.display = 'none';
                if (optellenHint) optellenHint.style.display = '';
            } else {
                if (aftrekkenHint) aftrekkenHint.style.display = '';
                if (optellenHint) optellenHint.style.display = '';
            }
        }
    }
    if (rekenHulpCheckbox) rekenHulpCheckbox.addEventListener('change', updateHulpWeergave);
    if (rekenBrugSelect) rekenBrugSelect.addEventListener('change', updateHulpWeergave);
    rekenTypeRadios.forEach(r => r.addEventListener('change', updateHulpWeergave));
    // initiale sync
    updateHulpWeergave();

    // --- Logica voor Vak 2: Bewerkingen ---
    const maakRekenBtn = document.getElementById('maakRekenBtn');
    const rekenMelding = document.getElementById('rekenMelding');
    if (maakRekenBtn) {
        maakRekenBtn.addEventListener('click', () => {
            if (rekenMelding) rekenMelding.textContent = '';
            const somTypes = Array.from(document.querySelectorAll('input[name="somType"]:checked')).map(cb => cb.value);
            if (somTypes.length === 0) {
                if (rekenMelding) rekenMelding.textContent = 'Kies minstens één type som!';
                return;
            }

            const brugSelect = document.getElementById('rekenBrug');
            const hulpCheckbox = document.getElementById('rekenHulpCheckbox');
            const schrijflijnenEl = document.getElementById('rekenHulpSchrijflijnen');
            const splitsRadio = document.querySelector('input[name="splitsPlaatsAftrekken"]:checked');

            const rekenHulp = {
                inschakelen: !!(hulpCheckbox && hulpCheckbox.checked && brugSelect && brugSelect.value !== 'zonder'),
                schrijflijnen: !!(schrijflijnenEl && schrijflijnenEl.checked),
                splitsPlaatsAftrekken: (splitsRadio ? splitsRadio.value : 'onderAftrektal')
            };

            const settings = {
                hoofdBewerking: 'rekenen',
                numOefeningen: parseInt((document.getElementById('numOefeningen_reken') || { value: 20 }).value),
                rekenMaxGetal: parseInt((document.getElementById('rekenMaxGetal') || { value: 100 }).value),
                rekenType: (document.querySelector('input[name="rekenType"]:checked') || { value: 'optellen' }).value,
                somTypes: somTypes,
                rekenBrug: brugSelect ? brugSelect.value : 'beide',
                rekenHulp
            };
            stuurDoor(settings);
        });
    }

    // --- Logica voor Vak 3: Tafels ---
    const maakTafelBtn = document.getElementById('maakTafelBtn');
    const tafelMelding = document.getElementById('tafelMelding');
    if (maakTafelBtn) {
        maakTafelBtn.addEventListener('click', () => {
            if (tafelMelding) tafelMelding.textContent = '';
            const gekozenTafels = Array.from(document.querySelectorAll('input[name="tafelNummer"]:checked')).map(cb => parseInt(cb.value));
            if (gekozenTafels.length === 0) {
                if (tafelMelding) tafelMelding.textContent = 'Kies minstens één tafel!';
                return;
            }
            const settings = {
                hoofdBewerking: 'tafels',
                numOefeningen: parseInt((document.getElementById('numOefeningen_tafel') || { value: 20 }).value),
                tafelType: (document.querySelector('input[name="tafelType"]:checked') || { value: 'maal' }).value,
                gekozenTafels: gekozenTafels,
                // --- Volgorde & 0-toelating (komen uit de HTML die we net toevoegden) ---
                tafelsVolgorde: (document.querySelector('input[name="tafelsVolgorde"]:checked') || { value: 'links' }).value,
                tafelsMetNul: !!(document.getElementById('tafelsMetNul') && document.getElementById('tafelsMetNul').checked),
            };
            stuurDoor(settings);
        });
    }

    // --- Algemene Functie om door te sturen ---
    function stuurDoor(settings) {
        localStorage.setItem('werkbladSettings', JSON.stringify(settings));
        window.location.href = 'bewerkingen_werkblad.html';
    }
});

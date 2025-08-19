document.addEventListener('DOMContentLoaded', () => {
    const bewegingen = {
        'spook': { tekst: 'Rechtstaan en BOE!', afbeelding: 'lees-afbeeldingen/spook.png' },
        'mijter': { tekst: 'Mijter uitbeelden', afbeelding: 'lees-afbeeldingen/mijter.png' },
        'paashaas': { tekst: 'Springen als paashaas', afbeelding: 'lees-afbeeldingen/paashaas.png' },
        'stampen': { tekst: 'Stampen met voeten', afbeelding: 'lees-afbeeldingen/stamp.png' },
        'springen': { tekst: 'Springen', afbeelding: 'lees-afbeeldingen/spring.png' },
        'reus': { tekst: 'Maak je groot', afbeelding: 'lees-afbeeldingen/reus.png' },
        'één been': { tekst: 'Op één been staan', afbeelding: 'lees-afbeeldingen/been.png' },
        'draaien': { tekst: 'Draai een rondje', afbeelding: 'lees-afbeeldingen/draai.png' },
        'lopen': { tekst: 'Loop op je plaats', afbeelding: 'lees-afbeeldingen/loop.png' },
        'knieheffen': { tekst: 'Hef je knieën hoog op', afbeelding: 'lees-afbeeldingen/knie.png' },
        'squat': { tekst: 'Doe squats', afbeelding: 'lees-afbeeldingen/squat.png' },
        'jumpingjacks': { tekst: 'Doe jumping jacks', afbeelding: 'lees-afbeeldingen/jumpingjacks.png' }
    };

    // DOM Elementen
    const itemList = document.getElementById('item-lijst');
    const addWordBtn = document.getElementById('voeg-woord-knop');
    const addMovementBtn = document.getElementById('voeg-beweging-knop');
    const startBtn = document.getElementById('start-knop');
    const stopBtn = document.getElementById('stop-knop');
    const settingsScreen = document.getElementById('instellingen-scherm');
    const generatorScreen = document.getElementById('generator-scherm');
    const displayElement = document.getElementById('display');
    const countdownBar = document.getElementById('countdown-bar');
    const overzichtInhoud = document.getElementById('overzicht-inhoud');
    const modal = document.getElementById('beweging-kiezer-modal');
    const modalCloseBtn = document.querySelector('.modal-sluiten');
    const bewegingOptiesContainer = document.getElementById('beweging-opties');

    let sequence = [];
    let currentIndex = 0;
    let timer;

    // --- AANGEPAST: Logica voor de modal ---
    
    // Zorg ervoor dat de modal standaard verborgen is
    modal.classList.add('modal-verborgen');

    const showModal = () => {
        modal.style.display = 'flex'; // Gebruik flex om te centreren
        modal.classList.remove('modal-verborgen');
    };

    const hideModal = () => {
        modal.style.display = 'none';
        modal.classList.add('modal-verborgen');
    };

    const populateBewegingKiezer = () => {
        bewegingOptiesContainer.innerHTML = '';
        for (const key in bewegingen) {
            const optie = document.createElement('div');
            optie.classList.add('beweging-optie');
            optie.dataset.key = key;
            const data = bewegingen[key];
            optie.innerHTML = `<img src="${data.afbeelding}" alt="${data.tekst}"> <span>${data.tekst}</span>`;
            optie.addEventListener('click', () => {
                addBewegingItem(key);
                hideModal();
            });
            bewegingOptiesContainer.appendChild(optie);
        }
    };

    addMovementBtn.addEventListener('click', showModal);
    modalCloseBtn.addEventListener('click', hideModal);
    window.addEventListener('click', (event) => {
        if (event.target == modal) {
            hideModal();
        }
    });

    // --- LIJSTBOUWER FUNCTIES ---
    const addWoordItem = () => {
        const li = document.createElement('li');
        li.classList.add('item');
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Typ een woord...';
        input.addEventListener('keyup', updateWoordenOverzicht);
        li.appendChild(input);
        addRemoveButton(li);
        itemList.appendChild(li);
        li.scrollIntoView({ behavior: 'smooth' });
    };

    const addBewegingItem = (key) => {
        const li = document.createElement('li');
        li.classList.add('item');
        li.dataset.bewegingKey = key;
        const data = bewegingen[key];
        li.innerHTML = `
            <div class="beweging-item-weergave">
                <img src="${data.afbeelding}" alt="${data.tekst}">
                <span>${data.tekst}</span>
            </div>
        `;
        addRemoveButton(li);
        itemList.appendChild(li);
        li.scrollIntoView({ behavior: 'smooth' });
    };

    const addRemoveButton = (li) => {
        const removeBtn = document.createElement('button');
        removeBtn.textContent = '🗑️';
        removeBtn.onclick = () => {
            li.remove();
            updateWoordenOverzicht();
        };
        li.appendChild(removeBtn);
    };

    addWordBtn.addEventListener('click', () => {
        addWoordItem();
        updateWoordenOverzicht();
    });

    const updateWoordenOverzicht = () => {
        const woordInputs = itemList.querySelectorAll('input[type="text"]');
        const woorden = Array.from(woordInputs)
            .map(input => input.value.trim())
            .filter(woord => woord !== '');
        if (woorden.length === 0) {
            overzichtInhoud.innerHTML = '<p>Nog geen woorden toegevoegd.</p>';
        } else {
            overzichtInhoud.innerHTML = woorden.join(', ');
        }
    };

    // --- GENERATOR LOGICA ---
    const startGenerator = () => {
        sequence = [];
        const items = itemList.querySelectorAll('.item');

        items.forEach(item => {
            const bewegingKey = item.dataset.bewegingKey;
            const input = item.querySelector('input[type="text"]');
            if (bewegingKey) {
                const bewegingData = bewegingen[bewegingKey];
                sequence.push({ type: 'beweging', value: bewegingData.afbeelding });
            } else if (input && input.value.trim() !== '') {
                sequence.push({ type: 'woord', value: input.value.trim() });
            }
        });

        if (sequence.length === 0) {
            alert('Voeg eerst woorden of bewegingen toe aan de lijst!');
            return;
        }

        settingsScreen.classList.add('verborgen');
        generatorScreen.classList.remove('verborgen');
        currentIndex = 0;
        showNextItem();
    };

    const showNextItem = () => {
        if (currentIndex >= sequence.length) {
            stopGenerator();
            displayElement.textContent = 'Einde!';
            return;
        }
        const item = sequence[currentIndex];
        const tijdWoord = document.getElementById('tijd-woord').value * 1000;
        const tijdAfbeelding = document.getElementById('tijd-afbeelding').value * 1000;
        let duration;

        if (item.type === 'woord') {
            displayElement.innerHTML = '';
            displayElement.textContent = item.value;
            duration = tijdWoord;
        } else {
            displayElement.innerHTML = `<img src="${item.value}" alt="Beweging">`;
            duration = tijdAfbeelding;
        }

        startCountdown(duration);
        currentIndex++;
        timer = setTimeout(showNextItem, duration);
    };
    
    const startCountdown = (duration) => {
        countdownBar.style.transition = 'none';
        countdownBar.style.width = '0%';
        setTimeout(() => {
            countdownBar.style.transition = `width ${duration / 1000}s linear`;
            countdownBar.style.width = '100%';
        }, 50);
    };

    const stopGenerator = () => {
        clearTimeout(timer);
        settingsScreen.classList.remove('verborgen');
        generatorScreen.classList.add('verborgen');
    };

    startBtn.addEventListener('click', startGenerator);
    stopBtn.addEventListener('click', stopGenerator);

    // Initialiseer alles bij het laden
    populateBewegingKiezer();
    updateWoordenOverzicht();
});
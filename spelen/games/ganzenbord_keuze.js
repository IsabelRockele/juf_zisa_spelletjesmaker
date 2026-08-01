document.addEventListener('DOMContentLoaded', () => {
    const tafelOpties = document.getElementById('tafel-opties');
    const soortOpties = document.getElementById('soort-opties');
    const aantalSpelersOpties = document.getElementById('aantal-spelers-opties');
    const startSpelKnop = document.getElementById('start-spel-knop');
    const knopTerugKeuze = document.getElementById('knopTerugKeuze'); // NIEUW: Terugknop is nu gedefinieerd

    let geselecteerdeTafels = [];
    let geselecteerdeSoort = null;
    let aantalSpelers = null; // Standaardwaarde nu 'null'

    // Zorg ervoor dat de startknop bij aanvang disabled is en de juiste tekst heeft
    controleerStartKnop();

    tafelOpties.addEventListener('click', (e) => {
        const clickedButton = e.target.closest('button.keuze');
        if (clickedButton) {
            const tafel = clickedButton.dataset.tafel;
            if (tafel === 'alle') {
                // Deselecteer eerst alle andere individuele tafels
                tafelOpties.querySelectorAll('button:not([data-tafel="alle"])').forEach(btn => btn.classList.remove('active'));
                geselecteerdeTafels = ['alle'];
                clickedButton.classList.add('active');
            } else {
                // Als 'alle' was geselecteerd, deselecteer deze dan
                const alleTafelsKnop = tafelOpties.querySelector('button[data-tafel="alle"]');
                if (alleTafelsKnop && geselecteerdeTafels.includes('alle')) {
                    alleTafelsKnop.classList.remove('active');
                    geselecteerdeTafels = [];
                }

                // Toggle logic for individual tables
                const index = geselecteerdeTafels.indexOf(parseInt(tafel));
                if (index > -1) {
                    geselecteerdeTafels.splice(index, 1);
                    clickedButton.classList.remove('active');
                } else {
                    geselecteerdeTafels.push(parseInt(tafel));
                    clickedButton.classList.add('active');
                }
            }
            controleerStartKnop();
        }
    });

    soortOpties.addEventListener('click', (e) => {
        const clickedButton = e.target.closest('button.keuze');
        if (clickedButton) {
            soortOpties.querySelectorAll('.keuze').forEach(btn => btn.classList.remove('active'));
            clickedButton.classList.add('active');
            geselecteerdeSoort = clickedButton.dataset.soort;
            controleerStartKnop();
        }
    });

    aantalSpelersOpties.addEventListener('change', (e) => {
        if (e.target.name === 'aantalSpelers') {
            aantalSpelers = e.target.value;
            controleerStartKnop();
        }
    });

    startSpelKnop.addEventListener('click', () => {
        if (startSpelKnop.disabled) return;

        // Sla de keuzes nog steeds op voor het spel zelf
        localStorage.setItem('ganzenbord_tafels', JSON.stringify(geselecteerdeTafels));
        localStorage.setItem('ganzenbord_soort', geselecteerdeSoort);
        localStorage.setItem('ganzenbord_aantalSpelers', aantalSpelers);

        window.location.href = 'ganzenbord_spel.html';
    });

    // NIEUW: Event listener voor de Terugknop is nu hier!
    if (knopTerugKeuze) { // Controleer of de knop bestaat
        knopTerugKeuze.addEventListener('click', () => {
            window.location.href = 'tafel3_spelletjes.html';
        });
    }


    function controleerStartKnop() {
        // De startknop is nu actief als tafels, soort én aantal spelers zijn gekozen
        if (geselecteerdeTafels.length > 0 && geselecteerdeSoort && aantalSpelers !== null) {
            startSpelKnop.disabled = false;
            startSpelKnop.textContent = 'Start het Spel!';
        } else {
            startSpelKnop.disabled = true;
            if (geselecteerdeTafels.length === 0) {
                startSpelKnop.textContent = 'Kies eerst je tafels';
            } else if (geselecteerdeSoort === null) {
                startSpelKnop.textContent = 'Kies een soort oefening';
            } else if (aantalSpelers === null) {
                startSpelKnop.textContent = 'Kies het aantal spelers';
            } else {
                startSpelKnop.textContent = 'Maak je keuzes compleet'; // Algemene fallback
            }
        }
    }

    // De functie laadOpgeslagenKeuzes() blijft onaangeroerd, aangezien deze niet meer wordt aangeroepen.
    // Dit zorgt ervoor dat eerdere keuzes niet automatisch worden geladen.
});
document.addEventListener('DOMContentLoaded', () => {
    const tafelOpties = document.getElementById('tafel-opties');
    const soortOpties = document.getElementById('soort-opties');
    const startSpelKnop = document.getElementById('start-spel-knop');
    const knopTerugKeuze = document.getElementById('knopTerugKeuze');

    let geselecteerdeTafels = [];
    let geselecteerdeSoort = null;

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

    startSpelKnop.addEventListener('click', () => {
        if (startSpelKnop.disabled) return;

        // Sla de keuzes op voor het spel zelf, nu specifiek voor Sombrero
        localStorage.setItem('sombrero_tafels', JSON.stringify(geselecteerdeTafels));
        localStorage.setItem('sombrero_soort', geselecteerdeSoort);

        window.location.href = 'sombrero_spel.html'; // Aangepast om naar sombrero_spel.html te verwijzen
    });

    // Event listener voor de Terugknop
    if (knopTerugKeuze) {
        knopTerugKeuze.addEventListener('click', () => {
            window.location.href = 'tafel3_spelletjes.html'; // Deze kan blijven zoals het is, of aanpassen indien nodig
        });
    }

    function controleerStartKnop() {
        // De startknop is nu actief als tafels en soort zijn gekozen
        if (geselecteerdeTafels.length > 0 && geselecteerdeSoort) {
            startSpelKnop.disabled = false;
            startSpelKnop.textContent = 'Start het Sombrero Spel!'; // Optionele tekst aanpassing
        } else {
            startSpelKnop.disabled = true;
            if (geselecteerdeTafels.length === 0) {
                startSpelKnop.textContent = 'Kies eerst je tafels';
            } else if (geselecteerdeSoort === null) {
                startSpelKnop.textContent = 'Kies een soort oefening';
            } else {
                startSpelKnop.textContent = 'Maak je keuzes compleet'; // Algemene fallback
            }
        }
    }
});
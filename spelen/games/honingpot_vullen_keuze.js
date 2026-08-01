// honingpot_vullen_keuze.js
document.addEventListener('DOMContentLoaded', () => {
    const levelButtons = document.querySelectorAll('#level-options .keuze');
    const operationButtons = document.querySelectorAll('#operation-options .keuze');
    const startSpelKnop = document.getElementById('start-spel-knop');

    let selectedLevel = null;
    let selectedOperation = null;

    function checkStartButtonStatus() {
        if (selectedLevel !== null && selectedOperation !== null) {
            startSpelKnop.disabled = false;
            startSpelKnop.textContent = "Start het Spel!";
        } else {
            startSpelKnop.disabled = true;
            startSpelKnop.textContent = "Kies eerst een bewerking";
        }
    }

    levelButtons.forEach(button => {
        button.addEventListener('click', () => {
            levelButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            selectedLevel = parseInt(button.dataset.level);
            checkStartButtonStatus();
        });
    });

    operationButtons.forEach(button => {
        button.addEventListener('click', () => {
            operationButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            selectedOperation = button.dataset.operation;
            checkStartButtonStatus();
        });
    });

    startSpelKnop.addEventListener('click', () => {
        if (selectedLevel !== null && selectedOperation !== null) {
            // Doorverwijzing naar de spelpagina met geselecteerde parameters
            window.location.href = `honingpot_vullen_spel.html?level=${selectedLevel}&operation=${selectedOperation}`;
        }
    });
});
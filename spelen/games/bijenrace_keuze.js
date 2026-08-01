// bijenrace_keuze.js
document.addEventListener('DOMContentLoaded', () => {
    const playerButtons = document.querySelectorAll('#player-options .keuze');
    const levelButtons = document.querySelectorAll('#level-options .keuze');
    const operationButtons = document.querySelectorAll('#operation-options .keuze');
    const startSpelKnop = document.getElementById('start-spel-knop');

    let selectedPlayers = null;
    let selectedLevel = null;
    let selectedOperation = null;

    function checkStartButtonStatus() {
        if (selectedPlayers !== null && selectedLevel !== null && selectedOperation !== null) {
            startSpelKnop.disabled = false;
            startSpelKnop.textContent = "Start het Spel!";
        } else {
            startSpelKnop.disabled = true;
            startSpelKnop.textContent = "Kies eerst";
        }
    }

    playerButtons.forEach(button => {
        button.addEventListener('click', () => {
            playerButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            selectedPlayers = parseInt(button.dataset.players);
            checkStartButtonStatus();
        });
    });

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
        if (selectedPlayers !== null && selectedLevel !== null && selectedOperation !== null) {
            // Redirect to the game page with selected parameters (e.g., using query parameters)
            window.location.href = `bijenrace_spel.html?players=${selectedPlayers}&level=${selectedLevel}&operation=${selectedOperation}`;
        }
    });

    // Initial check when the page loads
    checkStartButtonStatus();
});
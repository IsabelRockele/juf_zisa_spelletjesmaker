let leerlingen = [];

function sorteerLeerlingen() {
  leerlingen.sort((a, b) => a.localeCompare(b, 'nl'));
}

function renderLijst() {
  const lijst = document.getElementById('klaslijst');
  if (!lijst) return;

  sorteerLeerlingen();

  if (leerlingen.length === 0) {
    lijst.innerHTML = '<li class="leerling-empty">Nog geen leerlingen toegevoegd.</li>';
    return;
  }

  lijst.innerHTML = leerlingen.map((naam, index) => `
    <li class="leerling-item">
      <span class="leerling-naam">${naam}</span>
      <div class="leerling-acties">
        <button type="button" class="actie-btn actie-bewerk" data-index="${index}" title="Naam aanpassen">✏️</button>
        <button type="button" class="actie-btn actie-verwijder" data-index="${index}" title="Verwijderen">❌</button>
      </div>
    </li>
  `).join('');

  lijst.querySelectorAll('.actie-bewerk').forEach((button) => {
    button.addEventListener('click', () => {
      const index = Number(button.dataset.index);
      const huidigeNaam = leerlingen[index];
      const nieuweNaam = prompt('Pas de naam aan:', huidigeNaam);

      if (!nieuweNaam) return;

      leerlingen[index] = nieuweNaam.trim();
      leerlingen = leerlingen.filter((naam) => naam !== '');
      renderLijst();
    });
  });

  lijst.querySelectorAll('.actie-verwijder').forEach((button) => {
    button.addEventListener('click', () => {
      const index = Number(button.dataset.index);
      leerlingen.splice(index, 1);
      renderLijst();
    });
  });
}

export function initKlaslijst() {
  const addBtn = document.getElementById('addLeerlingBtn');
  const input = document.getElementById('leerlingInput');
  const plakBtn = document.getElementById('plakLijstBtn');

  addBtn?.addEventListener('click', () => {
    const naam = input?.value.trim();
    if (!naam) {
      alert('Typ eerst een naam in.');
      return;
    }

    if (!leerlingen.includes(naam)) {
      leerlingen.push(naam);
    }

    if (input) input.value = '';
    renderLijst();
  });

  input?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      addBtn?.click();
    }
  });

  plakBtn?.addEventListener('click', () => {
    const tekst = prompt(
`Plak hier je klaslijst.
Zet elke leerling op een nieuwe regel.

Voorbeeld:
Peeters Jan
Janssens Emma
De Smet Noor`
    );

    if (!tekst) return;

    const namen = tekst
      .split('\n')
      .map((naam) => naam.trim())
      .filter((naam) => naam !== '');

    namen.forEach((naam) => {
      if (!leerlingen.includes(naam)) {
        leerlingen.push(naam);
      }
    });

    renderLijst();
  });

  renderLijst();
}
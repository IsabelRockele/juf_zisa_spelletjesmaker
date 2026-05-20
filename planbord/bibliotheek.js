// === BIBLIOTHEEK ===
// Lijst van beschikbare PNG's in de map afbeeldingen/.
// Om een afbeelding toe te voegen: plaats het PNG-bestand in afbeeldingen/
// en voeg een regel toe aan deze array.

const BIBLIOTHEEK = [
  { bestand: 'fruit.png',           naam: 'fruit' },
  { bestand: 'koek.png',            naam: 'koek' },
  { bestand: 'drinkbus.png',        naam: 'drinkbus' },
  { bestand: 'huistaak.png',        naam: 'huistaak' },
  { bestand: 'brooddoos.png',       naam: 'brooddoos' },
  { bestand: 'dagelijkse_kost.png', naam: 'dagelijkse kost' },
  { bestand: 'klasagenda.png', naam: 'klasagenda kost' },
  { bestand: 'lezen.png', naam: 'lezen' },
  { bestand: 'lente.png', naam: 'lente' },
  { bestand: 'zomer.png', naam: 'zomer' },
  { bestand: 'herfst.png', naam: 'herfst' },
  { bestand: 'winter.png', naam: 'winter' },
  { bestand: 'kerst.png', naam: 'Kerst' },
  { bestand: 'carnaval.png', naam: 'carnaval' },
  { bestand: 'halloween.png', naam: 'Halloween' },
  { bestand: 'dikke_truien_dag.png', naam: 'Dikke truiendag' },
  { bestand: 'strapdag.png', naam: 'Strapdag' },
  // Voeg hier nieuwe afbeeldingen toe, bv.:
  // { bestand: 'leesboek.png', naam: 'leesboek' },
];

function _toonBibliotheek() {
  const grid = document.getElementById('bib-grid');
  grid.innerHTML = '';

  BIBLIOTHEEK.forEach((item) => {
    const div = document.createElement('div');
    div.className = 'bib-item';
    div.dataset.bestand = item.bestand;
    div.dataset.naam = item.naam;
    div.draggable = true;
    div.innerHTML = `
      <img src="afbeeldingen/${item.bestand}" alt="${item.naam}" onerror="this.outerHTML='<span style=\\'font-size:24px;\\'>🖼️</span>';" draggable="false" />
      <span class="naam">${item.naam}</span>
    `;
    div.addEventListener('click', () => {
      voegAfbeeldingToe(item.bestand, item.naam);
    });
    div.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', item.bestand);
      e.dataTransfer.effectAllowed = 'copy';
      div.classList.add('aan-het-slepen');
    });
    div.addEventListener('dragend', () => {
      div.classList.remove('aan-het-slepen');
    });
    grid.appendChild(div);
  });
}

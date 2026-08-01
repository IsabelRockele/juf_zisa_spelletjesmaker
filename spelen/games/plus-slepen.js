document.addEventListener('dragstart', function (e) {
  const origineel = e.target;

  // Voeg een controle toe voor de gele schijfjes (die nu in geel-slepen.js worden afgehandeld)
  if (origineel.classList.contains('geel-schijf')) {
    return; // Voorkom dat de gele schijfjes worden gesleept door deze code
  }

  // De rest van de code blijft hetzelfde voor de andere tools zoals kubusjes en de groene staaf
  if (!origineel.classList.contains('tool') || !origineel.closest('#toolbar')) return;

  const kloon = origineel.cloneNode(true);
  kloon.id = (origineel.id || 'tool') + '-kloon-' + Date.now();
  kloon.classList.add('tool');
  origineel.classList.forEach(cls => kloon.classList.add(cls));
  kloon.setAttribute('draggable', 'true');

  kloon.style.position = 'absolute';
  kloon.style.left = '-9999px';
  kloon.style.top = '-9999px';
  kloon.style.zIndex = '9999';
  kloon.style.pointerEvents = 'none';
  kloon.style.opacity = '0.85';

  // Specifieke stijl per tooltype
  if (origineel.classList.contains('staaf-groen')) {
    kloon.style.width = '200px';  // Match de afmetingen van de staaf in de toolbar
    kloon.style.height = '20px';
    kloon.style.border = '2px solid #444';
    kloon.style.backgroundColor = getComputedStyle(origineel).backgroundColor;
    kloon.style.borderRadius = '4px';
    kloon.innerHTML = origineel.innerHTML; // Zorg dat de verdeling erin zit
  } else {
    // standaard 40x40 tools: kubus, schijf, groen schijfje
    kloon.style.width = '40px';
    kloon.style.height = '40px';
    kloon.style.border = '2px solid #444';
    kloon.style.background = getComputedStyle(origineel).background;
    kloon.style.display = 'flex';
    kloon.style.alignItems = 'center';
    kloon.style.justifyContent = 'center';
    kloon.style.fontWeight = 'bold';
    kloon.style.fontSize = '18px';
    kloon.style.lineHeight = '40px';
    kloon.style.textAlign = 'center';
    kloon.style.boxSizing = 'border-box';
    kloon.textContent = origineel.textContent || '';

    // correcte vorm voor schijf of kubus
    kloon.style.borderRadius = (origineel.classList.contains('schijf') || origineel.classList.contains('geel-schijf')) ? '50%' : '6px';
  }

  document.body.appendChild(kloon);

  const img = new Image();
  img.src = '';
  e.dataTransfer.setDragImage(img, 0, 0);

  const rect = origineel.getBoundingClientRect();
  const dragOffset = { x: e.clientX - rect.left, y: e.clientY - rect.top };

  const onMouseMove = (ev) => {
    kloon.style.left = (ev.pageX - dragOffset.x) + 'px';
    kloon.style.top = (ev.pageY - dragOffset.y) + 'px';
  };

  document.addEventListener('dragover', onMouseMove);

  origineel.addEventListener('dragend', () => {
    document.removeEventListener('dragover', onMouseMove);
    kloon.remove();  // Verwijder het kloon wanneer het niet meer nodig is
  }, { once: true });
});

// Voeg de functie toe die controleert of 10 gele kubusjes zijn toegevoegd en deze vervangt door een groene staaf
function controleerGeleKubusjes() {
  const cirkels = document.querySelectorAll('#schema .cirkel');
  let geleKubusjes = 0;

  // Tel het aantal gele kubusjes in de cirkels
  for (let cirkel of cirkels) {
    if (cirkel.children.length === 1 && cirkel.firstElementChild.classList.contains('geel-blok')) {
      geleKubusjes++;
    }
  }

  // Als er precies 10 gele kubusjes zijn, vervang ze door een groene staaf
  if (geleKubusjes === 10) {
    // Verwijder alle gele kubusjes in de cirkels
    cirkels.forEach(cirkel => {
      // Zoek alle kubusjes met de class 'geel-blok' en verwijder ze
      const kubusjes = cirkel.querySelectorAll('.geel-blok');
      kubusjes.forEach(kubus => {
        kubus.remove();  // Verwijder de kubusjes
      });

      // Zorg ervoor dat de cirkel leeg is voor de nieuwe staaf
      cirkel.innerHTML = '';  // Leeg de cirkel volledig, indien er geen kubusjes meer zijn
    });

    // Plaats de groene staaf
    const lightVak = document.querySelector('.light-t');
    if (!lightVak) return;

    const groeneStaaf = document.createElement('div');
    groeneStaaf.classList.add('staaf-groen');
    groeneStaaf.textContent = '10';
    groeneStaaf.style.position = 'absolute';
    groeneStaaf.style.top = '50%';
    groeneStaaf.style.left = '50%';
    groeneStaaf.style.transform = 'translate(-50%, -50%)';
    groeneStaaf.style.width = '200px';  // Zorg ervoor dat de groene staaf dezelfde afmetingen heeft als in de toolbar
    groeneStaaf.style.height = '20px';
    groeneStaaf.style.border = '2px solid #444';
    groeneStaaf.style.backgroundColor = getComputedStyle(document.querySelector('#staaf')).backgroundColor;
    groeneStaaf.style.borderRadius = '4px';
    groeneStaaf.innerHTML = document.querySelector('#staaf .verdeling').outerHTML; // Zorg ervoor dat de verdeellijnen ook aanwezig zijn

    lightVak.innerHTML = '';  // Maak de plek voor de groene staaf leeg
    lightVak.appendChild(groeneStaaf);
  }
}

// Voeg de drop-functionaliteit toe aan de cirkels om het aantal kubusjes te controleren
document.querySelectorAll('.cirkel').forEach(cirkel => {
  cirkel.addEventListener('drop', (e) => {
    e.preventDefault();
    controleerGeleKubusjes(); // Controleer na elke drop of 10 kubusjes zijn toegevoegd
  });
});
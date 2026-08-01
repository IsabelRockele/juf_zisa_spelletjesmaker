
document.addEventListener('DOMContentLoaded', () => {
  const lightVak = document.querySelector('.light-t');
  const wisselVak = document.querySelector('.wissel-vak-plus') || lightVak; // Lichtgroen vak waar groene tools komen
  let wisselKnop = null;

  function verwijderWisselKnop() {
    if (wisselKnop) {
      wisselKnop.remove();
      wisselKnop = null;
    }
  }

  function toonWisselKnop(type) {
    verwijderWisselKnop();

    wisselKnop = document.createElement('button');
wisselKnop.textContent = 'Wissel om';
wisselKnop.className = 'wissel-knop';
wisselKnop.style.position = 'absolute';
wisselKnop.style.bottom = '10px';
wisselKnop.style.left = '50%';
wisselKnop.style.transform = 'translateX(-50%)';
wisselKnop.style.zIndex = '2000';

// Toevoeging voor grotere, iPad-vriendelijke knop
wisselKnop.style.fontSize = '1.5rem';
wisselKnop.style.padding = '1rem 2rem';
wisselKnop.style.minWidth = '200px';
wisselKnop.style.borderRadius = '1rem';

    wisselKnop.addEventListener('click', () => {
      // Wis alle gele tools in de cirkels
      const cirkels = document.querySelectorAll('#schema .cirkel');
      cirkels.forEach(c => c.innerHTML = '');

      // Maak groene tool
      let groenTool = document.createElement('div');
      groenTool.classList.add('tool');
      groenTool.style.position = 'absolute';
      groenTool.style.left = '50%';
      groenTool.style.top = '50%';
      groenTool.style.transform = 'translate(-50%, -50%)';

      if (type === 'schijfjes') {
        groenTool.classList.add('schijf', 'groen', 'groen-schijf');
        groenTool.innerHTML = '<span>10</span>';
      } else if (type === 'blokjes') {
        groenTool.classList.add('staaf-groen');
        groenTool.innerHTML = `
          <div class="verdeling">
            <div class="lijn" style="left: 20px;"></div>
            <div class="lijn" style="left: 40px;"></div>
            <div class="lijn" style="left: 60px;"></div>
            <div class="lijn" style="left: 80px;"></div>
            <div class="lijn" style="left: 100px;"></div>
            <div class="lijn" style="left: 120px;"></div>
            <div class="lijn" style="left: 140px;"></div>
            <div class="lijn" style="left: 160px;"></div>
            <div class="lijn" style="left: 180px;"></div>
          </div>
        `;
      }

      wisselVak.innerHTML = '';
      wisselVak.appendChild(groenTool);

      verwijderWisselKnop();
    });

    wisselVak.appendChild(wisselKnop);
  }

  window.controleerCirkels = function() {
    const cirkels = document.querySelectorAll('#schema .cirkel');
    if (cirkels.length !== 10) return;

    let alleSchijven = true;
    let alleBlokjes = true;

    cirkels.forEach(c => {
      const tool = c.querySelector('.tool');
      if (!tool || !(tool.classList.contains('schijf') && tool.classList.contains('geel'))) {
        alleSchijven = false;
      }
      if (!tool || !tool.classList.contains('geel-blok')) {
        alleBlokjes = false;
      }
    });

    if (alleSchijven) {
      toonWisselKnop('schijfjes');
    } else if (alleBlokjes) {
      toonWisselKnop('blokjes');
    } else {
      verwijderWisselKnop();
    }
  };
});

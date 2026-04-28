/* ─── PREVIEW.JS ─────────────────────────────────────────────────────────────
   Rendert de piramides als HTML in #previewContainer
─────────────────────────────────────────────────────────────────────────── */

const Preview = (() => {

  function renderPiramide(piramide, nr, toonOplossing) {
    const wrap = document.createElement('div');
    wrap.className = 'piramide-wrap';

    const nrLabel = document.createElement('div');
    nrLabel.className = 'piramide-nr';
    nrLabel.textContent = `Piramide ${nr}`;
    wrap.appendChild(nrLabel);

    const piramideEl = document.createElement('div');
    piramideEl.className = 'rekenpiramide';

    // Piramides van boven naar onder tekenen (top eerst)
    for (let r = piramide.rijen.length - 1; r >= 0; r--) {
      const rijEl = document.createElement('div');
      rijEl.className = 'piramide-rij';

      for (let i = 0; i < piramide.rijen[r].length; i++) {
        const vak = document.createElement('div');
        vak.className = 'piramide-vak';

        const isLeeg = piramide.leeg[r][i];

        if (isLeeg && !toonOplossing) {
          vak.classList.add('leeg');
          vak.textContent = '';
        } else if (isLeeg && toonOplossing) {
          vak.classList.add('oplossing');
          vak.textContent = piramide.rijen[r][i];
        } else {
          vak.textContent = piramide.rijen[r][i];
        }

        rijEl.appendChild(vak);
      }

      piramideEl.appendChild(rijEl);
    }

    wrap.appendChild(piramideEl);
    return wrap;
  }

  function render(piramides, toonOplossing) {
    const container = document.getElementById('previewContainer');
    container.innerHTML = '';

    piramides.forEach((p, idx) => {
      container.appendChild(renderPiramide(p, idx + 1, toonOplossing));
    });
  }

  return { render };

})();

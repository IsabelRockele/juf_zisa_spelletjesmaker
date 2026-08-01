
document.addEventListener('DOMContentLoaded', () => {
  const resetBtn = document.getElementById('reset');
  const terugBtn = document.getElementById('terug');

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      // Verwijder tools uit body
      document.querySelectorAll('body > .tool').forEach(el => el.remove());
      // Verwijder tools uit cirkels
      document.querySelectorAll('.cirkel .tool').forEach(el => el.remove());
      // Verwijder tools uit schema
      document.querySelectorAll('#schema .tool').forEach(el => el.remove());
      // Leeg inhoud van cirkels
      document.querySelectorAll('#schema .cirkel').forEach(c => c.innerHTML = '');
      // Leeg het vak bij T
      const lightVak = document.querySelector('.light-t');
      if (lightVak) lightVak.innerHTML = '';
      // Verberg alle tools uit toolbar
      document.getElementById('kubus').style.display = 'none';
      const staafEl = document.getElementById('staaf');
      if (staafEl) staafEl.style.display = 'none';
      document.getElementById('schijf-geel').style.display = 'none';
      document.getElementById('schijf-groen').style.display = 'none';
      // Activeer knoppen opnieuw
      if (typeof enableKnoppen === 'function') {
        enableKnoppen();
      }
    });
  }

  if (terugBtn) {
    terugBtn.addEventListener('click', () => {
      window.location.href = 'index.html';
    });
  }
});

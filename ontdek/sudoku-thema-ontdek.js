(() => {
  const freeThemes = new Set(['terug_naar_school', 'herfst', 'lente']);
  const select = document.getElementById('themeSelect');
  if (!select) return;
  [...select.options].forEach(option => {
    if (!option.value || freeThemes.has(option.value)) return;
    option.dataset.proLocked = 'true';
    if (!/PRO/.test(option.textContent)) option.textContent += ' — PRO';
  });
  select.addEventListener('change', event => {
    const option = select.selectedOptions[0];
    if (option?.dataset.proLocked !== 'true') return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const name = option.textContent.replace(/\s*—\s*PRO\s*$/, '');
    select.value = '';
    if (window.openOntdekProInfo) window.openOntdekProInfo(`Het Sudoku-thema “${name}” is beschikbaar in PRO. Lente, Herfst en Terug naar school kun je gratis uitproberen.`);
    else alert(`Het thema “${name}” is beschikbaar in PRO.`);
  }, true);
})();

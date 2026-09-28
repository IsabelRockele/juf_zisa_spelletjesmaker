(() => {
  const $ = id => document.getElementById(id);
  let family = [9, 15, 6];
  function mode(selected) {
    const refresher = selected === 'family';
    // Pause a running sequence before changing the representation.
    if ($('play').textContent.includes('Pauze')) $('play').click();
    $('book-lesson').hidden = refresher; $('settings').hidden = refresher;
    $('family-lesson').hidden = !refresher;
    $('mode-books').setAttribute('aria-pressed', String(!refresher));
    $('mode-family').setAttribute('aria-pressed', String(refresher));
    window.dispatchEvent(new CustomEvent('writing-mode', { detail: { family: refresher, key: refresher ? 'family:' + family.join(',') : selected } }));
    if (selected === 'books') window.dispatchEvent(new Event('resize'));
  }
  ['books','family'].forEach(name => $('mode-' + name).addEventListener('click', () => mode(name)));
  function setFamily(values) {
    family = values;
    family.forEach((n, i) => { $('family-number-' + (i+1)).textContent = n; $('family-' + (i+1)).value = n; });
    document.querySelectorAll('[data-family]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.family === family.join(','))));
    $('family-solutions').hidden = true; $('family-check').textContent = 'Toon de vier bewerkingen'; $('family-check').setAttribute('aria-expanded', 'false');
    $('family-error').textContent = '';
    mode('family');
  }
  document.querySelectorAll('[data-family]').forEach(button => button.addEventListener('click', () => setFamily(button.dataset.family.split(',').map(Number))));
  $('family-form').addEventListener('submit', event => {
    event.preventDefault(); const values = [1,2,3].map(i => Number($('family-' + i).value));
    const sorted = [...values].sort((x,y) => x-y);
    if (!values.every(n => Number.isInteger(n) && n > 0 && n <= 999) || sorted[0] + sorted[1] !== sorted[2]) { $('family-error').textContent = 'De twee kleinste getallen moeten samen het grootste getal vormen.'; return; }
    setFamily(values); $('family-form').closest('details').open = false;
  });
  $('family-check').addEventListener('click', () => {
    const [x,y,total] = [...family].sort((m,n) => m-n);
    const show = $('family-solutions').hidden;
    $('family-solutions').replaceChildren(...[`${x} + ${y} = ${total}`,`${y} + ${x} = ${total}`,`${total} − ${x} = ${y}`,`${total} − ${y} = ${x}`].map(text => { const line = document.createElement('p'); line.textContent = text; return line; }));
    $('family-solutions').hidden = !show; $('family-check').textContent = show ? 'Verberg de bewerkingen' : 'Toon de vier bewerkingen'; $('family-check').setAttribute('aria-expanded', String(show));
  });
})();

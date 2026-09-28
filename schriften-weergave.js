(() => {
  const button = document.getElementById('toggle-writing');
  const panel = document.getElementById('writing-panel');
  let currentMode = 'books', showWithBooks = false;
  function showWriting(show) {
    panel.hidden = !show;
    document.body.classList.toggle('handling-wide', !show);
    button.textContent = show ? 'Schrijfvlak verbergen' : 'Schrijfvlak tonen';
    button.setAttribute('aria-expanded', String(show));
    // Recalculate the book positions for the newly available height.
    window.dispatchEvent(new Event('resize'));
  }
  button.addEventListener('click', () => {
    const show = panel.hidden;
    if (currentMode === 'books') showWithBooks = show;
    showWriting(show);
  });
  window.addEventListener('writing-mode', event => {
    currentMode = event.detail.family ? 'family' : event.detail.key;
    showWriting(currentMode === 'books' ? showWithBooks : true);
  });
})();

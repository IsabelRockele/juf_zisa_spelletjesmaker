(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  let state = { books: [], away: [], calculation: null };
  let history = [], timer = null;
  let showCount = false, showEquation = false, showAnswer = false, dragGroup = false;
  let ignoreClickUntil = 0;
  const chosenColor = 'extra';
  let sortedColors = false;
  let bagOpen = false;
  const colorNames = { base: 'blauw', extra: 'rood' };
  const remember = () => { history.push(structuredClone(state)); if (history.length > 100) history.shift(); };
  function stop() { clearInterval(timer); timer = null; $('play').hidden = true; }
  function conceal() { showCount = showEquation = showAnswer = false; }
  function groupSize() { const n = Number($('change').value); return Number.isInteger(n) && n >= 1 && n <= 1000 ? n : null; }
  function move(source, amount, byColor = false, colorToMove = chosenColor) {
    stop(); if (!amount) return;
    const before = state.books.length;
    if (source === 'stack') amount = Math.min(amount, before);
    if (source === 'removed') amount = Math.min(amount, state.away.length);
    if (!amount) return;
    if (source !== 'stack' && before + amount > 1000) { $('message').textContent = 'Op dit bord passen maximaal 1000 schriften. Kies een kleiner aantal.'; return; }
    remember(); $('message').textContent = '';
    if (byColor) {
      const origin = source === 'stack' ? 'books' : 'away', target = source === 'stack' ? 'away' : 'books';
      const selected = state[origin].filter(color => color === colorToMove);
      amount = selected.length;
      state[target].push(...selected); state[origin] = state[origin].filter(color => color !== colorToMove);
    } else if (source === 'stack') state.away.push(...state.books.splice(-amount));
    else if (source === 'removed') state.books.push(...state.away.splice(-amount));
    else state.books.push(...Array(amount).fill(source === 'start' ? 'base' : 'extra'));
    const sign = source === 'stack' ? '−' : '+';
    const previous = state.calculation;
    state.calculation = previous && previous.sign === sign && previous.source === source ? { from: previous.from, sign, amount: previous.amount + amount, source } : { from: before, sign, amount, source };
    showAnswer = false; render();
  }
  function books(element, list) {
    // Fixed rows prevent overlap. A new column starts after every ten books.
    const fragment = document.createDocumentFragment();
    // Grouping only changes how a color can be picked up, never its position.
    const groups = [list];
    for (const group of groups) {
    const perColumn = element.id === 'removed' ? Math.max(1, group.length) : 10;
    for (let start = 0; start < group.length; start += perColumn) {
      const column = document.createElement('div'); column.className = 'book-column';
      for (const color of group.slice(start, start + perColumn)) { const book = document.createElement('div'); book.className = 'book ' + color; book.dataset.color = color; column.appendChild(book); }
      fragment.appendChild(column);
    }
    }
    element.replaceChildren(fragment);
  }
  function render() {
    const amount = groupSize(), count = state.books.length;
    $('bag').dataset.color = chosenColor;
    $('bag').classList.toggle('bag-open', bagOpen);
    $('bag').setAttribute('aria-expanded', String(bagOpen));
    $('bag').setAttribute('aria-label', bagOpen ? `Neem ${dragGroup ? 'een groep ' + (amount || '') : 'een'} ${colorNames[chosenColor]} ${dragGroup ? 'schriften' : 'schrift'} uit de boekentas en sleep naar de tafel` : 'Klik de boekentas open');
    document.querySelector('.bag-hint').textContent = bagOpen ? 'Pak hierboven een schrift vast' : 'Klik om de boekentas te openen';
    $('sort-colors').setAttribute('aria-pressed', String(sortedColors));
    $('sort-colors').textContent = sortedColors ? 'Groepering opheffen' : 'Groepeer per kleur';
    $('stack').classList.toggle('colors-grouped', sortedColors);
    $('removed').classList.toggle('colors-grouped', sortedColors);
    $('remove-color').textContent = 'Neem alle rode weg';
    $('return-color').textContent = 'Leg alle rode terug';
    $('remove-color').disabled = !state.books.includes(chosenColor);
    $('return-color').disabled = !state.away.includes(chosenColor);
    books($('stack'), state.books); books($('removed'), state.away);
    $('instruction').textContent = sortedColors ? 'Pak een schrift vast: sleep alle schriften van die kleur samen opzij of terug.' : 'Start met blauw. Haal rode schriften uit de boekentas om erbij te leggen.';
    $('group-add').textContent = `Leg ${amount ?? '…'} rode erbij`;
    $('group-remove').textContent = `Neem ${amount ?? '…'} weg`;
    $('group-return').textContent = `Leg ${amount ?? '…'} terug`;
    $('group-add').disabled = !amount;
    $('group-remove').disabled = !amount || count < amount;
    $('group-return').disabled = !amount || state.away.length < amount;
    $('take-one').disabled = !count;
    $('drag-group').setAttribute('aria-pressed', String(dragGroup));
    $('drag-group').textContent = dragGroup ? 'Slepen: hele groep' : 'Slepen: één schrift';
    $('count').hidden = !showCount; $('count').textContent = `${count} ${count === 1 ? 'schrift' : 'schriften'}`;
    $('stack').setAttribute('aria-label', showCount ? `${count} schriften op tafel` : 'Schriften op tafel');
    $('undo').disabled = !history.length;
    $('toggle-count').textContent = showCount ? 'Verberg aantal' : 'Toon aantal';
    $('toggle-count').setAttribute('aria-pressed', String(showCount));
    $('toggle-equation').disabled = !state.calculation;
    $('toggle-equation').textContent = showEquation ? 'Verberg bewerking' : 'Toon bewerking';
    $('toggle-equation').setAttribute('aria-pressed', String(showEquation));
    $('toggle-answer').hidden = !showEquation || !state.calculation;
    $('toggle-answer').textContent = showAnswer ? 'Verberg antwoord' : 'Toon antwoord';
    $('toggle-answer').setAttribute('aria-pressed', String(showAnswer));
    $('math').hidden = !showEquation || !state.calculation;
    if (state.calculation) {
      const { from, sign, amount: changed } = state.calculation;
      $('equation').textContent = `${from} ${sign} ${changed} = ${showAnswer ? count : '?'}`;
      $('arrows').textContent = `${from} ⟶ ${showAnswer ? count : '?'} (${sign}${changed})`;
    }
  }
  function setStart(animate) {
    const number = Number($('start').value);
    if (!Number.isInteger(number) || number < 0 || number > 1000) { $('error').textContent = 'Kies een geheel startaantal van 0 tot 1000.'; return; }
    stop(); remember(); state = { books: Array(animate ? 0 : number).fill('base'), away: [], calculation: null };
    bagOpen = false; conceal(); $('error').textContent = ''; $('settings').open = false; render();
    if (animate && number) {
      let remaining = number; $('play').hidden = false; $('play').textContent = 'Ⅱ Pauze';
      document.querySelector('.extra-controls').open = true;
      const tick = () => { state.books.push('base'); remaining--; render(); if (!remaining) stop(); };
      timer = setInterval(tick, 900); tick();
    }
  }
  $('lesson-form').addEventListener('submit', event => { event.preventDefault(); setStart(false); });
  $('build-start').addEventListener('click', () => setStart(true));
  $('play').addEventListener('click', stop);
  $('step').addEventListener('click', () => move('start', 1));
  $('take-one').addEventListener('click', () => move('stack', 1));
  $('group-add').addEventListener('click', () => move('bag', groupSize()));
  $('group-remove').addEventListener('click', () => move('stack', groupSize()));
  $('group-return').addEventListener('click', () => move('removed', groupSize()));
  $('change').addEventListener('input', render);
  $('sort-colors').addEventListener('click', () => { sortedColors = !sortedColors; render(); });
  $('remove-color').addEventListener('click', () => move('stack', state.books.filter(color => color === chosenColor).length, true));
  $('return-color').addEventListener('click', () => move('removed', state.away.filter(color => color === chosenColor).length, true));
  $('drag-group').addEventListener('click', () => { dragGroup = !dragGroup; render(); });
  $('undo').addEventListener('click', () => { stop(); if (history.length) { state = history.pop(); conceal(); render(); } });
  $('restart').addEventListener('click', () => { stop(); remember(); state = { books: [], away: [], calculation: null }; bagOpen = false; conceal(); render(); });
  $('new-calculation').addEventListener('click', () => { stop(); remember(); state.calculation = null; conceal(); render(); });
  $('toggle-count').addEventListener('click', () => { showCount = !showCount; render(); });
  $('toggle-equation').addEventListener('click', () => { showEquation = !showEquation; showAnswer = false; render(); });
  $('toggle-answer').addEventListener('click', () => { showAnswer = !showAnswer; render(); });
  for (const id of ['bag', 'stack', 'removed']) {
    const source = $(id); let drag = null;
    function quantity() { const n = dragGroup ? groupSize() : 1; return n && (id === 'bag' || (id === 'stack' ? state.books : state.away).length >= n) ? n : 0; }
    source.addEventListener('click', () => {
      if (Date.now() < ignoreClickUntil) return;
      if (id === 'bag' && !bagOpen) { bagOpen = true; render(); return; }
      if (sortedColors && id !== 'bag') return;
      move(id, quantity());
    });
    source.addEventListener('pointerdown', event => {
      const color = sortedColors && id !== 'bag' ? event.target.closest('.book')?.dataset.color : null;
      const amount = color ? (id === 'stack' ? state.books : state.away).filter(item => item === color).length : quantity();
      if (event.button !== 0 || drag || !amount || (sortedColors && id !== 'bag' && !color) || (id === 'bag' && !bagOpen)) return;
      stop(); drag = { id: event.pointerId, x: event.clientX, y: event.clientY, amount, color, ghost: null };
      source.setPointerCapture(event.pointerId);
    });
    source.addEventListener('pointermove', event => {
      if (!drag || event.pointerId !== drag.id) return;
      if (!drag.ghost && Math.hypot(event.clientX - drag.x, event.clientY - drag.y) > 8) {
        if (id === 'bag') source.classList.add('taking-book');
        drag.ghost = document.createElement('div'); drag.ghost.className = 'book drag-book ' + (drag.color || (id === 'bag' ? chosenColor : (id === 'stack' ? state.books : state.away).at(-1)));
        if (drag.amount > 1) { const badge = document.createElement('span'); badge.className = 'drag-amount'; badge.textContent = `× ${drag.amount}`; drag.ghost.appendChild(badge); }
        drag.ghost.setAttribute('aria-hidden', 'true'); document.body.appendChild(drag.ghost);
        document.querySelector(id === 'stack' ? '.removed-zone' : '.table-zone').classList.add('drop-ready');
      }
      if (drag.ghost) { event.preventDefault(); drag.ghost.style.left = `${event.clientX - 90}px`; drag.ghost.style.top = `${event.clientY - 15}px`; }
    });
    function finish(event, cancelled = false) {
      if (!drag || event.pointerId !== drag.id) return;
      const current = drag; drag = null;
      source.classList.remove('taking-book');
      document.querySelectorAll('.drop-ready').forEach(el => el.classList.remove('drop-ready'));
      if (!current.ghost) return;
      current.ghost.remove(); ignoreClickUntil = Date.now() + 500;
      const targets = id === 'stack' ? ['.removed-zone', '.bag-zone'] : ['.table-zone'];
      const inside = targets.some(selector => { const r = document.querySelector(selector).getBoundingClientRect(); return event.clientX >= r.left && event.clientX <= r.right && event.clientY >= r.top && event.clientY <= r.bottom; });
      if (!cancelled && inside) move(id, current.amount, !!current.color, current.color || chosenColor);
    }
    source.addEventListener('pointerup', event => finish(event));
    source.addEventListener('pointercancel', event => finish(event, true));
    source.addEventListener('lostpointercapture', event => finish(event, true));
  }
  $('fullscreen').addEventListener('click', async () => {
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); }
    catch { $('message').textContent = 'Gebruik eventueel F11 voor volledig scherm.'; }
  });
  document.addEventListener('fullscreenchange', () => { $('fullscreen').textContent = document.fullscreenElement ? 'Verlaat volledig scherm' : 'Volledig scherm'; });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  render();
})();

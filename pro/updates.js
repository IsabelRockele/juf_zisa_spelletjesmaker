// Updates blijven één kalendermaand zichtbaar, gerekend vanaf hun publicatiedatum.
(() => {
  const overlay = document.getElementById('updatesOverlay');
  const button = document.getElementById('updatesKnop');
  if (!overlay || !button) return;

  function refresh() {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Brussels', year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(new Date());
    const part = name => Number(parts.find(p => p.type === name).value);
    const today = Date.UTC(part('year'), part('month') - 1, part('day'));
    let active = 0;
    for (const item of overlay.querySelectorAll('li[data-datum]')) {
      const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(item.dataset.datum);
      let visible = false;
      if (match) {
        const [, year, month, day] = match.map(Number);
        const start = Date.UTC(year, month - 1, day);
        const date = new Date(start);
        const valid = date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
        // Bij 31 januari eindigt de maand op 28 (of 29) februari.
        const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
        const end = Date.UTC(year, month, Math.min(day, lastDay));
        visible = valid && today >= start && today < end;
      }
      item.hidden = !visible;
      item.style.display = visible ? '' : 'none';
      if (visible) active++;
    }
    button.style.display = active ? '' : 'none';
    if (!active) overlay.classList.remove('open');
  }

  refresh();
  button.addEventListener('click', refresh);
  document.addEventListener('visibilitychange', refresh);
  setInterval(refresh, 60 * 60 * 1000);
})();

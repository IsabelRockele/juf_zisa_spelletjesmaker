(() => {
  const page = location.pathname.toLowerCase();
  const rules = page.includes('geheimeboodschap')
    ? { selector: '.thema-knop', free: ['herfst', 'lente', 'terug_naar_school'] }
    : page.includes('hexagon')
      ? { selector: '#catalog-themes button', free: ['Dieren', 'School'] }
      : page.includes('coderen')
        ? { selector: '#catalog-themes button', free: ['Dieren', 'School'] }
        : page.includes('reken_en_kleur')
          ? { selector: '#catalog-themes button', free: ['Dieren', 'School'] }
          : page.includes('zoekverschillen')
            ? { selector: '#catalogThemes button', free: ['dieren', 'school'] }
            : null;
  const norm = value => String(value || '').replace(/\bPRO\b/gi, '').trim().toLocaleLowerCase('nl');
  const showInfo = name => window.openOntdekProInfo
    ? window.openOntdekProInfo(`Het thema “${name}” is beschikbaar in PRO. Je kunt dit venster sluiten en verder ontdekken.`)
    : alert(`Het thema “${name}” is beschikbaar in PRO.`);
  function apply() {
    if (!rules) return;
    const free = new Set(rules.free.map(norm));
    document.querySelectorAll(rules.selector).forEach(button => {
      if (button.dataset.ontdekThemeChecked === '1') return;
      const raw = button.dataset.theme || button.dataset.thema || button.dataset.value || button.textContent;
      const name = norm(raw);
      button.dataset.ontdekThemeChecked = '1';
      if (free.has(name)) return;
      button.dataset.proLocked = 'true';
      button.classList.add('ontdek-theme-pro');
      const badge = document.createElement('span');
      badge.className = 'ontdek-pro-word';
      badge.textContent = 'PRO';
      button.appendChild(badge);
    });
  }
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-pro-locked="true"]');
    if (!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    showInfo(norm(button.dataset.theme || button.dataset.thema || button.dataset.value || button.textContent));
  }, true);
  document.addEventListener('DOMContentLoaded', () => {
    apply();
    new MutationObserver(apply).observe(document.body, { childList: true, subtree: true });
  });
})();

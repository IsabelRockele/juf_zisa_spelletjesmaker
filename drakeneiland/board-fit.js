// Keep the complete adventure visible, including rewards above the answers.
(() => {
  const game = document.getElementById('game');
  const topbar = document.querySelector('.topbar');
  let frame = 0;
  function fit() {
    frame = 0;
    document.body.classList.toggle('board-playing', !game.hidden);
    game.style.zoom = '';
    game.style.width = '';
    if (game.hidden) return;
    // Measure at the actual board width before scaling. This also keeps team
    // columns stable when a correct answer changes a label or a winner appears.
    game.style.width = document.documentElement.clientWidth + 'px';
    const available = Math.max(1, window.innerHeight - topbar.getBoundingClientRect().height - 2);
    const height = game.getBoundingClientRect().height;
    game.style.zoom = Math.min(1, available / Math.max(1, height));
    window.scrollTo(0, 0);
  }
  function schedule() {
    if (!frame) frame = requestAnimationFrame(fit);
  }
  new MutationObserver(schedule).observe(game, { attributes: true, attributeFilter: ['hidden'] });
  new MutationObserver(schedule).observe(game, { childList: true, characterData: true, subtree: true });
  new ResizeObserver(schedule).observe(topbar);
  window.addEventListener('resize', schedule);
  document.addEventListener('fullscreenchange', schedule);
  game.addEventListener('load', schedule, true);
  document.fonts?.ready.then(schedule);
  schedule();
})();

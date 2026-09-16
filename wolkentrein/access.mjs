export function levelAllowed(level, discover) {
  return Number.isInteger(level) && level >= 1 && level <= (discover ? 1 : 6);
}
export function isDiscover() {
  if (new URLSearchParams(location.search).get('ontdek') === '1') return true;
  try { return sessionStorage.getItem('zisa_discover_preview') === '1'; } catch { return true; }
}
export function overviewUrl() {
  let grade = new URLSearchParams(location.search).get('leerjaar');
  try { grade ||= sessionStorage.getItem('zisa_play_grade'); } catch {}
  const path = ['1','2'].includes(grade) ? `../spelen/games/start_leerjaar${grade}.html` : '../spelen/index.html';
  return path + (isDiscover() ? '?ontdek=1' : '');
}

export function gamesOverview(search, storedGrade) {
  const grade = new URLSearchParams(search).get('leerjaar') || storedGrade;
  return grade === '3' || grade === '4'
    ? `../spelen/games/start_leerjaar${grade}.html`
    : '../spelen/index.html';
}
export function chooseOtherGame() {
  let grade;
  try { grade = sessionStorage.getItem('zisa_play_grade'); } catch {}
  location.assign(gamesOverview(location.search, grade));
}

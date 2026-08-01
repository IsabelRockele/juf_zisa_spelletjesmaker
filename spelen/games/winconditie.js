
// winconditie.js

function checkWin(row, col) {
  const directions = [
    [[0, 1], [0, -1]], // Horizontal
    [[1, 0], [-1, 0]], // Vertical
    [[1, 1], [-1, -1]], // Diagonal 1
    [[1, -1], [-1, 1]], // Diagonal 2
  ];

  let player = spelBord[row][col];
  for (let direction of directions) {
    let count = 1;
    for (let [dx, dy] of direction) {
      let r = row + dx;
      let c = col + dy;
      while (r >= 0 && r < 6 && c >= 0 && c < 7 && spelBord[r][c] === player) {
        count++;
        r += dx;
        c += dy;
      }
    }
    if (count >= 4) {
      gameOver = true;
      showWinner(player);
      return;
    }
  }
}

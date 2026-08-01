
// feedback.js

function showFiche(row, col) {
  const spelerVak = document.getElementById(`speler-${spelerBeurt}`);
  const fiche = document.createElement("div");
  fiche.classList.add("fiche");
  fiche.style.backgroundColor = spelerBeurt === 1 ? "yellow" : "red";
  spelerVak.appendChild(fiche);

  setTimeout(() => {
    fiche.style.transform = "scale(1.2)";
  }, 100); 

  // Show feedback based on the player's response
  if (spelerBeurt === 1) {
    showFeedback('Joepie!!', 'blij.png', 1);
  } else {
    showFeedback('Oeps!', 'droevig.png', 2);
  }
}

function showWinner(player) {
  feedback.style.display = "block";
  feedback.innerHTML = `<h2>Speler ${player} heeft gewonnen!</h2>`;
  const winnerImg = document.createElement("img");
  winnerImg.src = "tafels_afbeeldingen/zisa_wint.png";
  winnerImg.alt = "Zisa wint";
  feedback.appendChild(winnerImg);
}

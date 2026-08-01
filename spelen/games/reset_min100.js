
// reset_min100.js – functionaliteit voor de knop 'Opnieuw'

document.getElementById('reset').addEventListener('click', () => {
  // Verwijder alle tools uit rekenschema en cirkels
  document.querySelectorAll('.tool').forEach(tool => {
    if (tool.parentElement && tool.parentElement.id !== 'toolbar') {
      tool.remove();
    }
  });

  // Reset vuilbak teller
  document.getElementById('t-count').textContent = '0';
  document.getElementById('e-count').textContent = '0';

  // Toon opnieuw de knoppen
  const blokjesBtn = document.getElementById('blokjes');
  const schijfjesBtn = document.getElementById('schijfjes');
  blokjesBtn.disabled = false;
  schijfjesBtn.disabled = false;

  // Verberg alle tools terug in toolbar
  ['kubus', 'staaf', 'schijf-geel', 'schijf-groen'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
});

// Toegevoegd eventlistener voor de knop ‘terug’
document.addEventListener('DOMContentLoaded', () => {
  const terugKnop = document.getElementById('terug');
  if (terugKnop) {
    terugKnop.addEventListener('click', () => {
      console.log("Knop 'Ander schema' geklikt");
      window.location.href = "index.html";
    });
  }
});

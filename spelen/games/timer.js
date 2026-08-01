
function startVisueleTimer() {
  const canvas = document.getElementById('timer-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const totaleTijd = 120;
  let tijdVisueel = totaleTijd;

  function resizeCanvas() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }
  resizeCanvas();

  function tekenTaart(percentage) {
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2 + 16.5;  // lager geplaatst
    const radius = Math.min(w, h) / 2 - 38;
    ctx.clearRect(0, 0, w, h);

    let kleur = 'green';
    if (percentage < 0.3) kleur = 'red';
    else if (percentage < 0.6) kleur = 'orange';

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.fillStyle = kleur;
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + 2 * Math.PI * (1 - percentage);
    ctx.arc(cx, cy, radius, startAngle, endAngle, false);
    ctx.lineTo(cx, cy);
    ctx.fill();
  }

  tekenTaart(1);

  const visueelInterval = setInterval(() => {
    tijdVisueel--;
    const percentage = tijdVisueel / totaleTijd;
    tekenTaart(percentage);
    if (tijdVisueel <= 0) clearInterval(visueelInterval);
  }, 1000);
}

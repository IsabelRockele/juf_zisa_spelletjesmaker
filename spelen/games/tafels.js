document.addEventListener('DOMContentLoaded', function () {
  let geselecteerdeSoort = null;
  let geselecteerdeTafels = [];
  let tijdOver = 120;
  let scoreJuist = 0;
  let scoreFout = 0;
  let timerInterval;
  let huidigCorrectAntwoord = null;
  let isBeantwoord = false;
  let herhaalTimeoutId = null;

  const keuzeScherm = document.getElementById('keuzeScherm');
  const meldingType = document.getElementById('meldingType');
  const meldingTafels = document.getElementById('meldingTafels');
  const startKnop = document.getElementById('startSpel');
  const spelScherm = document.getElementById('spelScherm');
  const vraagContainer = document.getElementById('vraagContainer');
  const bellenContainer = document.getElementById('bellenContainer');
  const timerDisplay = document.getElementById('timer');

  document.getElementById('naarSpelletjes').addEventListener('click', () => {
    window.location.href = 'tafel_spelletjes.html';
  });
  
function isKleinScherm() {
  const width = Math.min(screen.width, screen.height);
  const height = Math.max(screen.width, screen.height);
  return (/iPad/.test(navigator.userAgent) && width <= 768 && height <= 1024) || window.innerWidth <= 1024;
}
  function genereerOefening() {
    const soort = geselecteerdeSoort === 'beide' ? (Math.random() < 0.5 ? 'maal' : 'delen') : geselecteerdeSoort;
    const getal1 = geselecteerdeTafels[Math.floor(Math.random() * geselecteerdeTafels.length)];
    const getal2 = Math.floor(Math.random() * 11);
    let vraag, correct;

    if (soort === 'maal') {
      vraag = `${getal1} × ${getal2}`;
      correct = getal1 * getal2;
    } else { 
      if (getal1 === 0) return genereerOefening();
      vraag = `${getal1 * getal2} ÷ ${getal1}`;
      correct = getal2;
    }
    return { vraag, correct };
  }

  function toonBellen(correct) {
    bellenContainer.innerHTML = '';
    let antwoorden = [correct];
    isBeantwoord = false;

    if (herhaalTimeoutId) {
      clearTimeout(herhaalTimeoutId);
    }

    let maxBellen = isKleinScherm() ? 4 : 5;
    while (antwoorden.length < maxBellen) {
      const fout = correct + Math.floor(Math.random() * 20) - 10;
      if (!antwoorden.includes(fout) && fout >= 0) {
        antwoorden.push(fout);
      }
    }

    antwoorden.sort(() => 0.5 - Math.random());
    let vastePosities;
    if (maxBellen === 4) {
      vastePosities = [40, 240, 450, 660];
    } else {
      vastePosities = [-90, 110, 320, 540, 740];
    }

    antwoorden.forEach((antwoord, index) => {
      const bel = document.createElement('div');
      bel.className = 'bel';
      
      bel.innerHTML = `
        <img src="tafels_afbeeldingen/zeepbel.png" alt="zeepbel">
        <span class="getal">${antwoord}</span>
        <span class="spetter" style="--x: ${Math.random() * 2 - 1}; --y: ${Math.random() * 2 - 1};"></span>
        <span class="spetter" style="--x: ${Math.random() * 2 - 1}; --y: ${Math.random() * 2 - 1};"></span>
        <span class="spetter" style="--x: ${Math.random() * 2 - 1}; --y: ${Math.random() * 2 - 1};"></span>
        <span class="spetter" style="--x: ${Math.random() * 2 - 1}; --y: ${Math.random() * 2 - 1};"></span>
      `;
      
      bel.style.left = `${vastePosities[index % vastePosities.length]}px`;
      bellenContainer.appendChild(bel);

      // AANGEPAST: Animatie pas toevoegen nadat element in de DOM staat
      setTimeout(() => {
          if(document.body.contains(bel)) { // Voorkom error als de bel al weg is
            bel.style.animation = `zweef 10s linear forwards`;
          }
      }, 10);


      const clickHandler = function () {
        if (isBeantwoord) return;
        isBeantwoord = true;
        if (herhaalTimeoutId) clearTimeout(herhaalTimeoutId);
        
        const isCorrect = Number(antwoord) === Number(correct);

        if (isCorrect) {
          scoreJuist++;
          document.getElementById("scoreJuist").textContent = scoreJuist;
          bel.classList.add('correct');
          
          setTimeout(() => {
            nieuweVraag();
          }, 600); 

        } else {
          scoreFout++;
          document.getElementById("scoreFout").textContent = scoreFout;
          bel.classList.add('fout');

          setTimeout(() => {
            bel.style.transition = "transform 0.3s ease, opacity 0.3s ease";
            bel.style.transform = "scale(0)";
            bel.style.opacity = "0";
            
            setTimeout(() => {
                nieuweVraag();
            }, 300);
          }, 1500);
        }
      };

      bel.addEventListener('click', clickHandler);
    });

    herhaalTimeoutId = setTimeout(() => {
      if (!isBeantwoord) {
        isBeantwoord = true;
        toonBellen(correct);
      }
    }, 8000);
  }

  function nieuweVraag() {
    const vraagContainer = document.getElementById('vraagContainer');
    const oef = genereerOefening();
    huidigCorrectAntwoord = oef.correct;
    if (vraagContainer) {
      vraagContainer.textContent = oef.vraag;
    }
    toonBellen(oef.correct);
  }

  function startTimer() {
    startVisueleTimer();

    timerInterval = setInterval(() => {
      tijdOver--;
      const min = String(Math.floor(tijdOver / 60)).padStart(2, '0');
      const sec = String(tijdOver % 60).padStart(2, '0');
      timerDisplay.textContent = `${min}:${sec}`;

      if (tijdOver <= 0) {
        clearInterval(timerInterval);
        eindeSpel();
      }
    }, 1000);
  }

  function eindeSpel() {
    if (herhaalTimeoutId) {
      clearTimeout(herhaalTimeoutId);
    }
    bellenContainer.innerHTML = '';
    document.querySelectorAll('.bel').forEach(bel => bel.remove());
    const feedbackContainer = document.getElementById('feedbackContainer');
    const feedbackText = document.getElementById('feedbackText');
    feedbackContainer.style.display = 'block';
    vraagContainer.style.display = 'none';

    let feedbackBericht = '';
    if (scoreJuist > scoreFout && scoreJuist > 10) {
        feedbackBericht = `Fantastisch! Je hebt ${scoreJuist} juiste antwoorden en maar ${scoreFout} foute. Goed gedaan!`;
    } else if (scoreJuist > scoreFout) {
        feedbackBericht = `Goed zo! Je hebt ${scoreJuist} juiste antwoorden en ${scoreFout} foute.`;
    } else {
        feedbackBericht = `Blijven oefenen! Je had ${scoreJuist} juiste antwoorden en ${scoreFout} foute. De volgende keer gaat het vast beter!`;
    }
    feedbackText.textContent = feedbackBericht;
  }

  function checkKeuzes() {
    const startKnop = document.querySelector('#startSpel');
    if (!startKnop) return;
    const allesGekozen = geselecteerdeSoort && geselecteerdeTafels.length > 0;
    startKnop.disabled = !allesGekozen;
    startKnop.textContent = allesGekozen ? "Start spel" : "Maak eerst je keuzes";
    startKnop.classList.toggle("actief", allesGekozen);
    startKnop.style.cursor = allesGekozen ? "pointer" : "not-allowed";
  }

  document.querySelectorAll('.keuze').forEach(button => {
    button.addEventListener('click', function () {
      document.querySelectorAll('.keuze').forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
      geselecteerdeSoort = this.dataset.type;
      meldingType.style.display = "none";
      checkKeuzes();
    });
  });

  document.querySelectorAll('.tafel').forEach(button => {
    button.addEventListener('click', function () {
      this.classList.toggle('active');
      const tafel = parseInt(this.dataset.tafel);
      if (geselecteerdeTafels.includes(tafel)) {
        geselecteerdeTafels = geselecteerdeTafels.filter(t => t !== tafel);
      } else {
        geselecteerdeTafels.push(tafel);
      }
      meldingTafels.style.display = geselecteerdeTafels.length === 0 ? "block" : "none";
      checkKeuzes();
    });
  });

  checkKeuzes();

  document.getElementById('startSpel').addEventListener('click', function () {
    if (!geselecteerdeSoort || geselecteerdeTafels.length === 0) {
      alert('Kies eerst een soort oefening en minstens één tafel.');
      return;
    }
    keuzeScherm.style.display = 'none';
    spelScherm.style.display = 'block';
    vraagContainer.style.display = 'inline-block';
    document.getElementById('feedbackContainer').style.display = 'none';

    score = 0;
    scoreJuist = 0;
    scoreFout = 0;
    document.getElementById("scoreJuist").textContent = 0;
    document.getElementById("scoreFout").textContent = 0;
    tijdOver = 120;
    clearInterval(timerInterval);
    if (herhaalTimeoutId) clearTimeout(herhaalTimeoutId);
    
    nieuweVraag();
    startTimer();
  });

  document.getElementById('knopOpnieuw').addEventListener('click', function () {
    document.getElementById('startSpel').click();
  });

  document.getElementById('knopKiezen').addEventListener('click', () => {
    clearInterval(timerInterval);
    if (herhaalTimeoutId) {
      clearTimeout(herhaalTimeoutId);
    }
    bellenContainer.innerHTML = '';
    document.getElementById('feedbackContainer').style.display = 'none';

    spelScherm.style.display = 'none';
    keuzeScherm.style.display = 'block';

    geselecteerdeSoort = null;
    geselecteerdeTafels = [];

    document.querySelectorAll('.keuze.active, .tafel.active').forEach(btn => {
        btn.classList.remove('active');
    });

    meldingType.style.display = "block";
    meldingTafels.style.display = "block";
    
    checkKeuzes();
  });

  function startVisueleTimer() {
    const canvas = document.getElementById('timer-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const totaleTijd = 120;
    let tijdVisueel = totaleTijd;

    let visueelInterval = null; 

    if (window.visueelTimerIntervalId) {
        clearInterval(window.visueelTimerIntervalId);
    }

    function resizeCanvas() {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }
    resizeCanvas();

    function tekenTaart(percentage) {
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2 + 16.5;
      const radius = Math.min(w, h) / 2 - 38;

      ctx.clearRect(0, 0, w, h);

      let kleur = '#2e7d32'; // Groen
      if (percentage < 0.2) kleur = '#b71c1c'; // Rood
      else if (percentage < 0.5) kleur = '#ff8f00'; // Oranje

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

    visueelInterval = setInterval(() => {
      tijdVisueel--;
      const percentage = tijdVisueel / totaleTijd;
      tekenTaart(percentage);
      if (tijdVisueel <= 0) clearInterval(visueelInterval);
    }, 1000);

    window.visueelTimerIntervalId = visueelInterval;
  }
});
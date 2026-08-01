let gekozenTafels = JSON.parse(sessionStorage.getItem("tafels")) || [2];

// Bepaal tijd en aantal oefeningen
let totaalOefeningen;
let tijdsduur;

if (gekozenTafels.length === 1) {
  tijdsduur = 120;
  totaalOefeningen = 20;
} else if (gekozenTafels.length <= 3) {
  tijdsduur = 180;
  totaalOefeningen = 25;
} else if (gekozenTafels.length <= 6) {
  tijdsduur = 300;
  totaalOefeningen = 40;
} else {
  tijdsduur = 350;
  totaalOefeningen = 50;
}

document.addEventListener("DOMContentLoaded", () => {
  const zin = document.getElementById("instructie-zin");
  if (zin) {
    zin.textContent = `Kan jij ${totaalOefeningen} oefeningen zonder fouten oplossen binnen de tijd?`;
  }
});

if (!gekozenTafels) {
  gekozenTafels = JSON.parse(localStorage.getItem("tafel_lijst")) || [2];
  sessionStorage.setItem("tafels", JSON.stringify(gekozenTafels));
}

// (Duplicaten in het originele bestand behouden – we wijzigen alleen iPad-invoer)
if (gekozenTafels.length === 1) {
  tijdsduur = 120;
  totaalOefeningen = 20;
} else if (gekozenTafels.length <= 3) {
  tijdsduur = 180;
  totaalOefeningen = 25;
} else if (gekozenTafels.length <= 6) {
  tijdsduur = 300;
  totaalOefeningen = 40;
} else {
  tijdsduur = 350;
  totaalOefeningen = 50;
}

document.addEventListener("DOMContentLoaded", () => {
  const zin = document.getElementById("instructie-zin");
  if (zin) {
    zin.textContent = `Kan jij ${totaalOefeningen} oefeningen zonder fouten oplossen binnen de tijd?`;
  }
});

if (gekozenTafels.length === 1) {
  tijdsduur = 120;
  totaalOefeningen = 20;
} else if (gekozenTafels.length <= 3) {
  tijdsduur = 180;
  totaalOefeningen = 25;
} else if (gekozenTafels.length <= 6) {
  tijdsduur = 300;
  totaalOefeningen = 40;
} else {
  document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("instructie-zin").textContent =
      `Kan jij ${totaalOefeningen} oefeningen zonder fouten oplossen binnen de tijd?`;
  });
  tijdsduur = 350;
  totaalOefeningen = 50;
}

let opgaven = [];
let huidigeIndex = 0;
let scoreJuist = 0;
let scoreFout = 0;
let timerInterval;
let visueelInterval;
let dansAnimatieInterval;
let dansIndex = 1;

const opgaveZone = document.getElementById("opgave");
const invoerveld = document.getElementById("invoerveld");
const toetsenbord = document.getElementById("toetsenbord");
const feedback = document.getElementById("feedback");
const vuurwerkDiv = document.getElementById("vuurwerk");
const juf = document.getElementById("juf");
const bord = document.getElementById("bord");
const startKnop = document.getElementById("start-knop");
const timerDisplay = document.getElementById("timer");

/* NIEUW: nooit iPad-toetsenbord openen bij focus */
invoerveld.addEventListener('focus', () => invoerveld.blur());

function genereerOpgaven() {
  const alleOpgaven = [];
  let gekozenType = sessionStorage.getItem("tafel_type") || "maal";
  gekozenTafels.forEach(tafel => {
    if (gekozenType === "maal" || gekozenType === "beide") {
      for (let i = 0; i <= 10; i++) {
        alleOpgaven.push({ vraag: `${i} × ${tafel}`, juist: i * tafel });
      }
    }
    if (gekozenType === "delen" || gekozenType === "beide") {
      for (let i = 0; i <= 10; i++) {
        alleOpgaven.push({ vraag: `${i * tafel} ÷ ${tafel}`, juist: i });
      }
    }
  });
  alleOpgaven.sort(() => Math.random() - 0.5);
  return alleOpgaven;
}

function startLevel3() {
  document.getElementById("instructie-zin").style.display = "none";
  startKnop.style.display = "none";
  invoerveld.style.display = "block";
  toonToetsenbord();
  opgaven = genereerOpgaven();
  huidigeIndex = 0;
  scoreJuist = 0;
  scoreFout = 0;
  document.getElementById("scoreJuist").textContent = 0;
  document.getElementById("scoreFout").textContent = 0;
  startTimer();
  startVisueleTimer(tijdsduur);
  toonVolgende();
}

function toonVolgende() {
  if (huidigeIndex >= opgaven.length) {
    opgaven = genereerOpgaven();
    huidigeIndex = 0;
  }
  const huidige = opgaven[huidigeIndex];
  opgaveZone.textContent = `${huidige.vraag} = ?`;
  invoerveld.value = "";
}

function toetsInvoegen(waarde) {
  if (waarde === "←") {
    invoerveld.value = invoerveld.value.slice(0, -1);
  } else if (waarde === "OK") {
    controleerAntwoord();
  } else {
    invoerveld.value += waarde;
  }
}

function controleerAntwoord() {
  const antwoord = parseInt(invoerveld.value);
  const juisteAntwoord = opgaven[huidigeIndex].juist;
  if (antwoord === juisteAntwoord) {
    scoreJuist++;
    document.getElementById("scoreJuist").textContent = scoreJuist;
  } else {
    scoreFout++;
    document.getElementById("scoreFout").textContent = scoreFout;
  }
  huidigeIndex++;
  toonVolgende();
}

function toonToetsenbord() {
  const toetsen = ["1","2","3","4","5","6","7","8","9","0","←","OK"];
  toetsenbord.innerHTML = "";
  toetsen.forEach(t => {
    const knop = document.createElement("button");
    knop.className = "toets";
    knop.textContent = t;

    /* NIEUW: iPad-proof – gebruik één pointer-event (geen click/touch-dubbel) */
    knop.addEventListener("pointerup", (e) => {
      e.preventDefault();
      toetsInvoegen(t);
    }, { passive: false });

    toetsenbord.appendChild(knop);
  });
}

function startTimer() {
  let resterendeTijd = tijdsduur;
  updateTimerDisplay(resterendeTijd);
  timerInterval = setInterval(() => {
    resterendeTijd--;
    updateTimerDisplay(resterendeTijd);
    if (resterendeTijd <= 0) {
      clearInterval(timerInterval);
      clearInterval(visueelInterval);
      eindEvaluatie();
    }
  }, 1000);
}

function updateTimerDisplay(sec) {
  const min = String(Math.floor(sec / 60)).padStart(2, '0');
  const secs = String(sec % 60).padStart(2, '0');
  timerDisplay.textContent = `${min}:${secs}`;
}

function startVisueleTimer(tijd) {
  const canvas = document.getElementById('timer-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let tijdVisueel = tijd;

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
    let kleur = 'green';
    if (tijdVisueel <= 15) {
      kleur = 'red';
    } else if (tijdVisueel <= tijd / 2) {
      kleur = 'orange';
    }
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
    const percentage = tijdVisueel / tijd;
    tekenTaart(percentage);
    if (tijdVisueel <= 0) clearInterval(visueelInterval);
  }, 1000);
}

function eindEvaluatie() {
  invoerveld.style.display = "none";
  toetsenbord.innerHTML = "";
  opgaveZone.textContent = "";
  bord.style.display = "none";
  juf.style.display = "none";
  if (scoreFout === 0 && scoreJuist >= totaalOefeningen) {
    feedback.innerHTML = `
      <img id="dansZisa" src="tafels_afbeeldingen/zisa_danst1.png" style="max-width:300px;"><br>Fantastisch gedaan!`;
    animatieZisaDans();
    vuurwerkEffect();
  } else {
    feedback.innerHTML = `
      <div style="background-color: #d0ecff; border: 2px solid #a3d3f5; border-radius: 12px; padding: 20px; max-width: 500px; margin: 0 auto;">
        <img src="tafels_afbeeldingen/zisa_twijfel.png" alt="Juf Zisa twijfelend" style="max-width: 120px; display: block; margin: 0 auto 15px auto;" />
        <p style="font-size: 1.3em; color: #065a82;">Goed geprobeerd!<br>Probeer het later nog eens of oefen eerst wat extra in Level 2.</p>
      </div>`;
  }
}

function animatieZisaDans() {
  const zisa = document.getElementById("dansZisa");
  const dansFrames = ["zisa_danst1.png", "zisa_danst2.png", "zisa_danst3.png"];
  dansAnimatieInterval = setInterval(() => {
    dansIndex = (dansIndex + 1) % dansFrames.length;
    zisa.src = `tafels_afbeeldingen/${dansFrames[dansIndex]}`;
  }, 400);
}

function vuurwerkEffect() {
  vuurwerkDiv.style.display = "block";
  for (let i = 0; i < 15; i++) {
    const bol = document.createElement("div");
    bol.className = "vuurwerk-bol";
    bol.style.left = `${Math.random() * 90 + 5}%`;
    bol.style.top = `${Math.random() * 80 + 10}%`;
    vuurwerkDiv.appendChild(bol);
    setTimeout(() => bol.remove(), 2000);
  }
  setTimeout(() => {
    vuurwerkDiv.style.display = "none";
    vuurwerkDiv.innerHTML = "";
  }, 2500);
}

function opnieuwOefenen() { location.reload(); }
function gaTerug() { window.location.href = "tafel_oefenen.html"; }

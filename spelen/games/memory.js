// memory.js

document.addEventListener("DOMContentLoaded", () => {
  const spelbord = document.getElementById("spelbord");
  const scoreContainer = document.getElementById("score-container");
  const feedback = document.getElementById("feedback");
  const btnOpnieuw = document.getElementById("btn-opnieuw");
  const keuzeScherm = document.getElementById("keuzeScherm");
  const spelScherm = document.getElementById("spelScherm");
  const startKnop = document.getElementById("startSpel");
  const meldingType = document.getElementById("meldingType");
  const meldingTafels = document.getElementById("meldingTafels");
  const meldingSpelers = document.getElementById("meldingSpelers");

  let soort = null;
  let tafels = [];
  let spelerAantal = null;
  let beurt = 1;
  let score = [0, 0];
  let openKaarten = [];
  let kaarten = [];

  function checkKeuzes() {
    const klaar = soort && tafels.length > 0 && spelerAantal;
    startKnop.disabled = !klaar;
    startKnop.textContent = klaar ? "Start spel" : "Maak eerst je keuzes";
    startKnop.style.cursor = klaar ? "pointer" : "not-allowed";

    meldingType.style.display = soort ? "none" : "block";
    meldingTafels.style.display = tafels.length > 0 ? "none" : "block";
    meldingSpelers.style.display = spelerAantal ? "none" : "block";
  }

  document.querySelectorAll(".keuze").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".keuze").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      soort = btn.dataset.type;
      checkKeuzes();
    });
  });

  document.querySelectorAll(".tafel").forEach(btn => {
    if (btn.dataset.tafel === "0") {
      btn.style.display = "none";
    }
    btn.addEventListener("click", () => {
      const tafel = parseInt(btn.dataset.tafel);
      btn.classList.toggle("active");
      if (tafels.includes(tafel)) {
        tafels = tafels.filter(t => t !== tafel);
      } else {
        tafels.push(tafel);
      }
      checkKeuzes();
    });
  });

  document.querySelectorAll(".spelers").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".spelers").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      spelerAantal = parseInt(btn.dataset.aantal);
      checkKeuzes();
    });
  });

  startKnop.addEventListener("click", () => {
    if (!soort || tafels.length === 0 || !spelerAantal) {
        checkKeuzes();
        return;
    }
    keuzeScherm.style.display = "none";
    spelScherm.style.display = "block";
    startMemorySpel();
  });

  function genereerKaarten() {
    let oefeningen = [];
    tafels.forEach(getal1 => {
      const limiet = (soort === "delen" && getal1 === 0) ? -1 : 10;
      for (let i = 0; i <= limiet; i++) {
        let vraag, antwoord;
        let actueelSoort = soort;

        if (actueelSoort === "beide") {
            actueelSoort = Math.random() < 0.5 ? "maal" : "delen";
        }
        
        if (actueelSoort === "maal") {
          vraag = `${getal1} × ${i}`;
          antwoord = getal1 * i;
        } else { // Delen
          if (getal1 === 0) continue;
          vraag = `${getal1 * i} ÷ ${getal1}`;
          antwoord = i;
        }
        const uniekeID = `${vraag}=${antwoord}-${Math.random().toString(36).substr(2, 5)}`;
        oefeningen.push({ id: uniekeID, vraag, antwoord });
      }
    });

    const isIPadMini = window.innerWidth === 1024 && window.innerHeight === 768;

const parenAantal = isIPadMini ? 6 : (tafels.length >= 4 ? 8 : 6);
const kolommen = parenAantal === 6 ? 4 : 4;
spelbord.style.gridTemplateColumns = `repeat(${kolommen}, 160px)`;

    const uniekeAntwoorden = new Set();
    const uniekeOefeningen = [];

    for (const oef of oefeningen.sort(() => 0.5 - Math.random())) {
      if (!uniekeAntwoorden.has(oef.antwoord)) {
        uniekeOefeningen.push(oef);
        uniekeAntwoorden.add(oef.antwoord);
      }
      if (uniekeOefeningen.length >= parenAantal) break;
    }

    kaarten = [];
    uniekeOefeningen.forEach(item => {
      kaarten.push({ id: item.id, inhoud: item.vraag, type: "vraag" });
      kaarten.push({ id: item.id, inhoud: item.antwoord.toString(), type: "antwoord" });
    });

    kaarten = kaarten.sort(() => 0.5 - Math.random());
    } // <--- DEZE SLUIT HAALT 'genereerKaarten()' CORRECT AF

  function startMemorySpel() {
    spelbord.innerHTML = "";
    scoreContainer.innerHTML = "";
    feedback.style.display = "none";
    score = [0, 0];
    beurt = 1;
    openKaarten = [];

    genereerKaarten();

    kaarten.forEach(data => {
      const kaart = document.createElement("div");
      kaart.className = "kaart";
      kaart.dataset.id = data.id;
      kaart.dataset.type = data.type;
      kaart.innerHTML = `
        <div class="kant achterkant"></div>
        <div class="kant voorkant">${data.inhoud}</div>
      `;
      kaart.addEventListener("click", () => draaiKaart(kaart));
      spelbord.appendChild(kaart);
    });

    for (let i = 0; i < spelerAantal; i++) {
      const stapel = document.createElement("div");
      stapel.className = `stapel speler speler-${i + 1}`;
      stapel.id = `stapel-${i + 1}`;
      stapel.innerHTML = `Speler ${i + 1}<br><span id="score-${i + 1}">0</span> paren<div class="kaart-stapel" id="kaarten-${i + 1}"></div>`;
      scoreContainer.appendChild(stapel);
    }
    
    document.querySelectorAll('.speler').forEach(el => el.classList.remove('actief'));
    const actieveSpeler = document.querySelector('.speler-1');
    if (actieveSpeler) actieveSpeler.classList.add('actief');
  }

  function draaiKaart(kaart) {
    if (
      kaart.classList.contains("gevonden") ||
      kaart.classList.contains("omgedraaid") ||
      openKaarten.length === 2
    ) return;

    kaart.classList.add("omgedraaid");
    openKaarten.push(kaart);

    if (openKaarten.length === 2) {
      setTimeout(() => controleerMatch(), 800);
    }
  }

  function controleerMatch() {
    const [kaart1, kaart2] = openKaarten;

    if (
      kaart1.dataset.id === kaart2.dataset.id &&
      kaart1.dataset.type !== kaart2.dataset.type
    ) {
      // Correcte match
      kaart1.classList.add("gevonden");
      kaart2.classList.add("gevonden");

      score[beurt - 1]++;
      document.getElementById(`score-${beurt}`).textContent = score[beurt - 1];
      
      setTimeout(() => {
          kaart1.style.visibility = 'hidden';
          kaart2.style.visibility = 'hidden';

          const stapelDiv = document.getElementById(`kaarten-${beurt}`);
          if (stapelDiv) {
              for (let i = 0; i < 2; i++) {
                  const visueelKaartje = document.createElement("div");
                  visueelKaartje.className = "kaartje-in-stapel";
                  const offset = stapelDiv.children.length * 3;
                  visueelKaartje.style.top = `${offset}px`;
                  visueelKaartje.style.left = `${offset}px`;
                  stapelDiv.appendChild(visueelKaartje);
              }
          }
      }, 500);

      if (document.querySelectorAll(".kaart:not(.gevonden)").length === 0) {
        setTimeout(toonFeedback, 600);
      }
    } else {
      // Foute match
      kaart1.classList.remove("omgedraaid");
      kaart2.classList.remove("omgedraaid");
      if (spelerAantal === 2) {
        beurt = beurt === 1 ? 2 : 1;
        document.querySelectorAll('.speler').forEach(el => el.classList.remove('actief'));
        const actieveSpeler = document.querySelector(`.speler-${beurt}`);
        if (actieveSpeler) actieveSpeler.classList.add('actief');
      }
    }

    openKaarten = [];
  }

  function toonFeedback() {
    feedback.style.display = "block";
    feedback.style.backgroundColor = "#e0f7fa";
    feedback.style.padding = "20px";
    feedback.style.borderRadius = "12px";
    feedback.style.margin = "30px auto";
    feedback.style.maxWidth = "500px";
    feedback.innerHTML = `
      <img src="tafels_afbeeldingen/zisa_wint.png" alt="Juf Zisa" style="max-width: 150px; height: auto; display: block; margin: 10px auto;">
      <div id="feedback-tekst" style="font-size: 1.4em; color: #003049; text-align: center; margin-top: 15px;"></div>
    `;
    const feedbackTekst = document.getElementById("feedback-tekst");
    if (spelerAantal === 1) {
      feedbackTekst.textContent = `Goed gedaan! Je vond ${score[0]} paren. Wil je nog een keer proberen?`;
    } else {
      if (score[0] > score[1]) {
        feedbackTekst.textContent = `Speler 1 wint met ${score[0]} paren tegen ${score[1]}! Proficiat!`;
      } else if (score[1] > score[0]) {
        feedbackTekst.textContent = `Speler 2 wint met ${score[1]} paren tegen ${score[0]}! Proficiat!`;
      } else {
        feedbackTekst.textContent = `Gelijkspel met ${score[0]} paren! Het was een spannende wedstrijd!`;
      }
    }
  }

  btnOpnieuw.addEventListener("click", () => {
    startMemorySpel();
  });
  
  window.terugNaarKeuzeScherm = function() {
    document.getElementById("spelScherm").style.display = "none";
    document.getElementById("keuzeScherm").style.display = "block";
    document.getElementById("feedback").style.display = "none";

    soort = null;
    tafels = [];
    spelerAantal = null;

    document.querySelectorAll(".keuze.active, .tafel.active, .spelers.active").forEach(btn => {
        btn.classList.remove("active");
    });

    checkKeuzes();
  }
});
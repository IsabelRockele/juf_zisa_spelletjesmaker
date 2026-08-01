// splits_bijenkorf.js – met ronde 2 en feedbackuitbreiding

let maxGetal = 5;
let scoreJuist = 0;
let scoreFout = 0;
let oefeningen = [];
let fouteOefeningen = [];
let huidigeOefening = 0;
let tweedeRonde = false;

window.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  maxGetal = parseInt(params.get("max")) || 5;

  document.getElementById("btn-terug").addEventListener("click", () => {
    window.location.href = "splitsen_bibi.html";
  });

  document.getElementById("btn-opnieuw").addEventListener("click", () => {
    window.location.reload();
  });

  genereerOefeningen();
  toonVolgendeOefening();
});

function genereerOefeningen() {
  oefeningen = [];
  for (let i = 0; i < 20; i++) {
    const getal = Math.floor(Math.random() * maxGetal) + 1;
    const deel1 = Math.floor(Math.random() * (getal + 1));
    const deel2 = getal - deel1;
    const vraagLinks = Math.random() < 0.5;

    oefeningen.push({
      totaal: getal,
      bekend: vraagLinks ? deel2 : deel1,
      onbekend: vraagLinks ? deel1 : deel2,
      vraagLinks: vraagLinks,
      origineel: true
    });
  }
}

function toonVolgendeOefening() {
  if (huidigeOefening >= oefeningen.length) return toonFeedback();

  const oef = oefeningen[huidigeOefening];
  const splitsingEl = document.getElementById("splitsing");
  splitsingEl.innerHTML = `
  <div class="splitsboom">
    <div class="bovengetal">${oef.totaal}</div>
    <div class="lijnen">
      <div class="lijn lijn-links"></div>
      <div class="lijn lijn-rechts"></div>
    </div>
    <div class="benen">
      <div class="been">${oef.vraagLinks ? "?" : oef.bekend}</div>
      <div class="been">${oef.vraagLinks ? oef.bekend : "?"}</div>
    </div>
  </div>`;

document.getElementById("jufBibiFeedback")?.remove(); // eventueel oude verwijderen

if (tweedeRonde) {
  const feedbackDiv = document.createElement("div");
  feedbackDiv.id = "jufBibiFeedback";
  feedbackDiv.className = "juf-bibi-feedback";
  feedbackDiv.style.display = "none";
  feedbackDiv.innerHTML = `
    <div class="feedback-tekst">
      Juiste antwoord: <span id="antwoordTekst"></span>
    </div>
    <img src="leerjaar1_afbeeldingen/juf_bibi.png" alt="Juf Bibi" class="juf-bibi-afbeelding">`;
  splitsingEl.appendChild(feedbackDiv);
}


  toonBijen(oef.onbekend);
}

function toonBijen(juisteAntwoord) {
  const container = document.getElementById("bijenrij");
  container.innerHTML = "";
  let antwoorden = [juisteAntwoord];

  const oef = oefeningen[huidigeOefening];
  const foutOptelling = oef.totaal + oef.bekend;
  if (foutOptelling !== juisteAntwoord && !antwoorden.includes(foutOptelling)) {
    antwoorden.push(foutOptelling);
  }

  while (antwoorden.length < 4) {
    const willekeurig = Math.floor(Math.random() * (maxGetal + 1));
    if (!antwoorden.includes(willekeurig)) antwoorden.push(willekeurig);
  }

  antwoorden.sort(() => 0.5 - Math.random());

  antwoorden.forEach(antwoord => {
    const bij = document.createElement("div");
    bij.className = "bij";
    bij.innerHTML = `
      <img src="leerjaar1_afbeeldingen/bijtje.png" alt="bij" />
      <span class="getal">${antwoord}</span>
    `;
    bij.addEventListener("click", () => controleerAntwoord(bij, antwoord === juisteAntwoord, juisteAntwoord));
    container.appendChild(bij);
  });
}

function controleerAntwoord(bijElement, juist, juisteAntwoord) {
  const container = document.getElementById("bijenrij");
  container.querySelectorAll(".bij").forEach(b => b.style.pointerEvents = "none");

  const huidige = oefeningen[huidigeOefening];

  if (juist) {
    bijElement.classList.add("vlieg-naar-korf");
    scoreJuist++;
    document.getElementById("scoreJuist").textContent = scoreJuist;
  } else {
    bijElement.classList.add("fout");
    scoreFout++;
    document.getElementById("scoreFout").textContent = scoreFout;
    if (huidige.origineel) fouteOefeningen.push(huidige);
    if (!huidige.origineel) {
      const feedbackBlok = document.getElementById("jufBibiFeedback");
      if (feedbackBlok) {
        feedbackBlok.style.display = "block";
        document.getElementById("antwoordTekst").textContent = juisteAntwoord;
      }
    }
  }

  setTimeout(() => {
    huidigeOefening++;
    toonVolgendeOefening();
  }, juist ? 1000 : 1300);
}

function toonFeedback() {
  const feedbackContainer = document.getElementById("feedbackContainer");
  const feedbackText = document.getElementById("feedbackText");
  const feedbackImg = document.getElementById("feedbackAfbeelding");
  
  const splitsContainer = document.querySelector(".splits-container");
  const bijenContainer = document.getElementById("bijenrij");

  splitsContainer.style.display = "none";
  bijenContainer.style.display = "none";
  feedbackContainer.style.display = "block";

  if (!tweedeRonde && fouteOefeningen.length > 0) {
    feedbackText.textContent = "We gaan je foutjes nog eens opnieuw maken.";
    feedbackImg.src = "leerjaar1_afbeeldingen/juf_bibi.png";
    setTimeout(() => startTweedeRonde(), 3000);
    return;
  }

  if (fouteOefeningen.length === 0 && scoreFout === 0) {
    feedbackText.textContent = tweedeRonde
      ? "Goed gedaan! Probeer de volgende keer alles in ronde 1 juist te hebben."
      : "Dikke proficiat!";
    feedbackImg.src = "leerjaar1_afbeeldingen/juichende_bibi.png";
  } else {
    feedbackText.textContent = "Je bent goed aan het oefenen. Probeer nog eens tot je het zonder fouten kan.";
    feedbackImg.src = "leerjaar1_afbeeldingen/juf_bibi.png";
  }
}

function startTweedeRonde() {
  oefeningen = fouteOefeningen.map(oef => ({ ...oef, origineel: false }));
  fouteOefeningen = [];
  huidigeOefening = 0;
  tweedeRonde = true;
  scoreFout = 0;
  scoreJuist = 0;
  document.getElementById("scoreJuist").textContent = "0";
  document.getElementById("scoreFout").textContent = "0";

  document.querySelector(".splits-container").style.display = "block";
  document.getElementById("bijenrij").style.display = "flex";
  document.getElementById("feedbackContainer").style.display = "none";

  toonVolgendeOefening();
}


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
  const schud = lijst => {
    for (let i = lijst.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [lijst[i], lijst[j]] = [lijst[j], lijst[i]];
    }
    return lijst;
  };
  const gewoneSplitsingenPerTotaal = new Map();
  const nulSplitsingen = [];

  for (let totaal = 2; totaal <= maxGetal; totaal++) {
    const splitsingen = [];
    for (let deel1 = 1; deel1 < totaal; deel1++) {
      splitsingen.push({ totaal, deel1, deel2: totaal - deel1 });
    }
    gewoneSplitsingenPerTotaal.set(totaal, schud(splitsingen));
    nulSplitsingen.push({ totaal, deel1: 0, deel2: totaal });
    nulSplitsingen.push({ totaal, deel1: totaal, deel2: 0 });
  }

  // Hoogstens twee nulsplitsingen per spel; de overige oefeningen komen
  // gespreid uit alle gekozen totalen en alle mogelijke niet-nulsplitsingen.
  const gekozen = [];
  const totalen = [...gewoneSplitsingenPerTotaal.keys()];
  while (gekozen.length < 18) {
    for (const totaal of schud([...totalen])) {
      let voorraad = gewoneSplitsingenPerTotaal.get(totaal);
      if (!voorraad.length) {
        voorraad = schud(Array.from({ length: totaal - 1 }, (_, i) => ({
          totaal, deel1: i + 1, deel2: totaal - i - 1
        })));
        gewoneSplitsingenPerTotaal.set(totaal, voorraad);
      }
      gekozen.push(voorraad.pop());
      if (gekozen.length === 18) break;
    }
  }
  gekozen.push(...schud(nulSplitsingen).slice(0, 2));
  schud(gekozen);

  oefeningen = gekozen.map(({ totaal, deel1, deel2 }) => {
    const vraagLinks = Math.random() < 0.5;
    return {
      totaal,
      bekend: vraagLinks ? deel2 : deel1,
      onbekend: vraagLinks ? deel1 : deel2,
      vraagLinks: vraagLinks,
      origineel: true
    };
  });
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

function vliegBijNaarKorf(bijElement) {
  const korf = document.querySelector('.bijenkorf');
  if (!korf) {
    bijElement.classList.add('vlieg-naar-korf');
    return;
  }

  const start = bijElement.getBoundingClientRect();
  const korfRect = korf.getBoundingClientRect();
  // De donkere opening staat ongeveer in het midden en op 55% van de afbeelding.
  const doelX = korfRect.left + korfRect.width * 0.5;
  const doelY = korfRect.top + korfRect.height * 0.55;
  const startX = start.left + start.width * 0.5;
  const startY = start.top + start.height * 0.5;
  const dx = doelX - startX;
  const dy = doelY - startY;

  const vliegendeBij = bijElement.cloneNode(true);
  vliegendeBij.classList.remove('fout', 'vlieg-naar-korf');
  Object.assign(vliegendeBij.style, {
    position: 'fixed', left: `${start.left}px`, top: `${start.top}px`,
    width: `${start.width}px`, height: `${start.height}px`, margin: '0',
    zIndex: '2147482500', pointerEvents: 'none', transformOrigin: 'center'
  });
  document.body.appendChild(vliegendeBij);
  bijElement.style.visibility = 'hidden';

  const bocht = Math.max(55, Math.min(120, Math.abs(dx) * 0.28));
  const controlX = dx * 0.42;
  const controlY = Math.min(0, dy) - bocht;
  const duur = 1400;
  const begonnen = performance.now();
  function frame(nu) {
    const tijd = Math.min(1, (nu - begonnen) / duur);
    const t = 1 - Math.pow(1 - tijd, 2.4);
    const omgekeerd = 1 - t;
    const x = 2 * omgekeerd * t * controlX + t * t * dx;
    const y = 2 * omgekeerd * t * controlY + t * t * dy;
    const schaal = 1 - 0.88 * Math.pow(t, 2.2);
    const draai = Math.sin(t * Math.PI * 5) * (1 - t) * 9;
    vliegendeBij.style.transform = `translate(${x}px,${y}px) rotate(${draai}deg) scale(${schaal})`;
    vliegendeBij.style.opacity = String(t < .86 ? 1 : Math.max(.12, 1 - (t - .86) / .14));
    if (tijd < 1) requestAnimationFrame(frame);
    else vliegendeBij.remove();
  }
  requestAnimationFrame(frame);
}

function controleerAntwoord(bijElement, juist, juisteAntwoord) {
  const container = document.getElementById("bijenrij");
  container.querySelectorAll(".bij").forEach(b => b.style.pointerEvents = "none");

  const huidige = oefeningen[huidigeOefening];

  if (juist) {
    vliegBijNaarKorf(bijElement);
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
  }, juist ? 1500 : 1300);
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


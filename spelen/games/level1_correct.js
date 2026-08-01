// JavaScript voor Level 1 – tafels oefenen met visueel tafel-label

let gekozenTafels = JSON.parse(sessionStorage.getItem("tafels")) || [2];
let huidigeTafelIndex = 0;
let huidigeTafel = gekozenTafels[huidigeTafelIndex];

const opgaven = [];
let huidigeIndex = 0;
let fouten = [];
let foutenEersteRonde = [];
let ronde1Score = 0;
let ronde2Score = 0;
let ronde1PerTafel = {};
let herhaling = false;
let huidigOpgave = null;

const opgaveZone = document.getElementById("opgave");
const antwoordenContainer = document.getElementById("antwoorden");
const feedback = document.getElementById("feedback");
const ballon = document.getElementById("ballon");
const tafelLabel = document.getElementById("tafel-label");

function genereerOpgaven() {
  huidigeTafel = gekozenTafels[huidigeTafelIndex];
  const lijst = [];
  for (let i = 0; i <= 10; i++) {
    lijst.push({
      vraag: `${i} × ${huidigeTafel}`,
      juist: i * huidigeTafel
    });
  }
  return lijst;
}

function startOefeningen() {
  opgaven.length = 0;
  fouten.length = 0;
  foutenEersteRonde.length = 0;
  ronde1Score = 0;
  ronde2Score = 0;
  herhaling = false;
  huidigeTafel = gekozenTafels[huidigeTafelIndex];
  if (!(huidigeTafel in ronde1PerTafel)) {
  ronde1PerTafel[huidigeTafel] = 0;
}
  tafelLabel.textContent = `Je oefent nu de huidigeTafel van ${huidigeTafel}`;
  opgaven.push(...genereerOpgaven());
  huidigeIndex = 0;
  ballon.style.display = "none";
  feedback.innerHTML = "";
  toonVolgende();
}

function toonVolgende() {
  ballon.style.display = "none";

  if (huidigeIndex >= opgaven.length) {
    if (!herhaling && fouten.length > 0) {
      foutenEersteRonde = [...fouten];
      opgaven.length = 0;
      opgaven.push(...fouten);
      fouten.length = 0;
      huidigeIndex = 0;
      herhaling = true;
      opgaveZone.innerHTML = "We gaan nu de foutjes nog eens oefenen...";
      antwoordenContainer.innerHTML = "";
      setTimeout(toonVolgende, 1500);
    } else if (herhaling || (!herhaling && fouten.length === 0)) {
      if (huidigeTafelIndex < gekozenTafels.length - 1) {
        huidigeTafelIndex++;
        startOefeningen();
      } else if (!herhaling && fouten.length === 0) {

      if (huidigeTafelIndex < gekozenTafels.length - 1) {
        huidigeTafelIndex++;
        huidigeTafel = gekozenTafels[huidigeTafelIndex];
        toonMelding(`Tafel van ${gekozenTafels[huidigeTafelIndex - 1]} afgerond. Nu volgt de tafel van ${huidigeTafel}!`);
        startOefeningen(); // herstart met volgende tafel
      } else {
        toonFeedback(); // pas na laatste tafel
      }

return;
        
    toonFeedback();

      } else {
        toonFeedback();
      }
    }
    return;
  }
  huidigOpgave = opgaven[huidigeIndex];
  opgaveZone.innerHTML = `<span>${huidigOpgave.vraag} = </span><span id="dropvak" class="dropvak">...</span>`;
  toonAntwoorden(huidigOpgave.juist);
}

function toonAntwoorden(juistAntwoord) {
  antwoordenContainer.innerHTML = "";
  const opties = [juistAntwoord];
  while (opties.length < 3) {
    const fout = Math.floor(Math.random() * 21);
    if (!opties.includes(fout)) opties.push(fout);
  }
  opties.sort(() => Math.random() - 0.5);
  opties.forEach(antwoord => {
    const el = document.createElement("div");
    el.className = "antwoord";
    el.draggable = true;
    el.textContent = antwoord;
    el.dataset.value = antwoord;
    el.addEventListener("dragstart", e => {
      e.dataTransfer.setData("text/plain", antwoord);
    });
    antwoordenContainer.appendChild(el);
  });
}

document.addEventListener("dragover", e => e.preventDefault());
document.addEventListener("drop", e => {
  const dropvak = document.getElementById("dropvak");
  if (!dropvak) return;

  e.preventDefault();
  const gekozen = parseInt(e.dataTransfer.getData("text/plain"));
  const juist = huidigOpgave.juist;
  const antwoordVeld = [...document.querySelectorAll(".antwoord")].find(a => parseInt(a.textContent) === gekozen);

  if (gekozen === juist) {
    dropvak.textContent = gekozen;
    if (!herhaling) {
      ronde1Score++;
      huidigeTafel = gekozenTafels[huidigeTafelIndex];
      ronde1PerTafel[tafel]++;
    } else {
      ronde2Score++;
    }
    setTimeout(() => {
      huidigeIndex++;
      toonVolgende();
    }, 500);
  } else {
    if (antwoordVeld) antwoordVeld.style.backgroundColor = "#ff6b6b";
    dropvak.textContent = gekozen;
    fouten.push(huidigOpgave);
    ballon.textContent = `Het juiste antwoord is ${juist}`;
    ballon.style.display = "block";
    ballon.style.top = "200px";
    ballon.style.right = "-200px";
    setTimeout(() => {
      ballon.style.display = "none";
      huidigeIndex++;
      toonVolgende();
    }, 1500);
  }
});

function opnieuwOefenen() {
  document.getElementById("tafels-lijst").innerHTML = "";
  document.getElementById("knop-level2").innerHTML = "";
  document.getElementById("vuurwerk").style.display = "none";
  document.getElementById("vuurwerk").innerHTML = "";
  feedback.innerHTML = "";
  startOefeningen();
}

function gaTerug() {
  window.location.href = "tafel_oefenen.html";
}

function gaNaarLevel2() {
  window.location.href = "level2.html";
}

function toonFeedback() {
  console.log("✅ toonFeedback wordt uitgevoerd");
  antwoordenContainer.innerHTML = "";
  opgaveZone.innerHTML = "";

  const feedbackHTML = document.createElement("div");
  feedbackHTML.style.fontSize = "1em";
  feedbackHTML.style.color = "white";
  feedbackHTML.style.margin = "0";
  feedbackHTML.innerHTML = `
    <p>
      <strong>Score ronde 1:</strong> ${ronde1Score} / 11<br>
      <strong>Score ronde 2:</strong> ${ronde2Score} / ${foutenEersteRonde.length}<br><br>
      ${ronde1Score === 11
        ? "🎉 Je deed alles in één keer goed! Je mag naar Level 2."
        : "Goed geoefend! Oefen gerust nog een keer of probeer het opnieuw."}
    </p>
  `;

  const knop = document.createElement("button");
  knop.textContent = "Level 2 ▶";
  knop.style.padding = "16px 32px";
  knop.style.fontSize = "1.6em";
  knop.style.marginTop = "15px";
  knop.style.backgroundColor = "#2e7d32";
  knop.style.color = "white";
  knop.style.border = "none";
  knop.style.borderRadius = "12px";
  knop.style.cursor = "pointer";
  knop.addEventListener("click", gaNaarLevel2);

  feedback.innerHTML = "";
  feedback.appendChild(feedbackHTML);

  if (ronde1Score === 11) {
    const vuurwerkDiv = document.getElementById("vuurwerk");
    vuurwerkDiv.style.display = "block";
    for (let i = 0; i < 12; i++) {
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

    const knopContainer = document.createElement("div");
    knopContainer.id = "level2-button-container";
    knopContainer.style.position = "relative";
    knopContainer.style.top = "-80px";
    knopContainer.style.marginTop = "15px";
    knopContainer.style.textAlign = "center";
    knopContainer.appendChild(knop);

    const container = document.getElementById("knop-level2");
    container.innerHTML = "";
    container.appendChild(knopContainer);
  }

  const overzicht = document.getElementById("tafels-lijst");
  console.log("💬 tafels-lijst wordt gevuld");
  if (overzicht) {
    overzicht.innerHTML = "";
    gekozenTafels.forEach(huidigeTafel => {
      const badge = document.createElement("span");
      badge.className = "tafelbadge";
      console.log("📊 Tafel", huidigeTafel, "- correct in ronde 1:", ronde1PerTafel[tafel]);
      const correct = ronde1PerTafel[tafel] || 0;
      const goed = correct === 11;
      badge.textContent = `×${tafel} ${goed ? '✅' : '❌'}`;
      overzicht.appendChild(badge);
    });
  }
}

startOefeningen();



function toonMelding(tekst) {
    const melding = document.createElement("div");
    melding.textContent = tekst;
    melding.style.position = "absolute";
    melding.style.top = "40%";
    melding.style.left = "50%";
    melding.style.transform = "translate(-50%, -50%)";
    melding.style.background = "#006400";
    melding.style.color = "white";
    melding.style.padding = "20px";
    melding.style.borderRadius = "20px";
    melding.style.fontSize = "2em";
    melding.style.zIndex = "1000";
    document.body.appendChild(melding);
    setTimeout(() => {
        melding.remove();
    }, 3000);
}

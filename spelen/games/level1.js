// OVERRULE gekozen tafels - test altijd met 2,3,4
let gekozenTafels = JSON.parse(sessionStorage.getItem("tafels")) || [2];

// Helper om te tellen hoeveel echte oefeningen (geen overgangszinnen)
function aantalEchteOpgaven() {
  return gekozenTafels.length * 11;
}

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

function genereerOpgavenPerTafel() {
  const lijst = [];
  let gekozenType = sessionStorage.getItem("tafel_type") || "maal";
  gekozenTafels.forEach((tafel, idx) => {
    if (gekozenType === "maal" || gekozenType === "beide") {
      for (let i = 0; i <= 10; i++) {
        lijst.push({
          vraag: `${i} × ${tafel}`,
          juist: i * tafel,
          tafel: tafel,
          index: i,
          soort: "maal"
        });
      }
    }
    if (gekozenType === "delen" || gekozenType === "beide") {
      for (let i = 0; i <= 10; i++) {
        lijst.push({
          vraag: `${i * tafel} ÷ ${tafel}`,
          juist: i,
          tafel: tafel,
          index: i,
          soort: "delen"
        });
      }
    }
    if (idx < gekozenTafels.length - 1) {
      lijst.push({
        overgang: true,
        volgendeTafel: gekozenTafels[idx + 1]
      });
    }
  });
  return lijst;
}

function startOefeningen() {
  opgaven.length = 0;
  fouten.length = 0;
  foutenEersteRonde.length = 0;
  ronde1Score = 0;
  ronde2Score = 0;
  herhaling = false;
  ronde1PerTafel = {};
  tafelLabel.textContent = `Je oefent nu de tafels: ${gekozenTafels.join(', ')}`;
  opgaven.push(...genereerOpgavenPerTafel());
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
      fouten.sort((a, b) => a.tafel - b.tafel || a.index - b.index);
      let gestructureerd = [];
      let laatsteTafel = null;
      fouten.forEach(fout => {
        if (fout.tafel !== laatsteTafel) {
          if (laatsteTafel !== null) {
            gestructureerd.push({
              overgang: true,
              volgendeTafel: fout.tafel,
              herhaling: true
            });
          }
          laatsteTafel = fout.tafel;
        }
        gestructureerd.push(fout);
      });
      opgaven.push(...gestructureerd);
      fouten.length = 0;
      huidigeIndex = 0;
      herhaling = true;
      opgaveZone.innerHTML = "We gaan nu de foutjes nog eens oefenen...";
      antwoordenContainer.innerHTML = "";
      setTimeout(toonVolgende, 1500);
      return;
    } else {
      toonFeedback();
      return;
    }
  }

  const opg = opgaven[huidigeIndex];
  if (opg.overgang) {
    let zin = opg.herhaling
      ? `<span style="font-size:1.3em;color:white;">Nu komen de fouten van de tafel van ${opg.volgendeTafel}</span>`
      : `<span style="font-size:1.3em;color:white;">Nu komt de tafel van ${opg.volgendeTafel}</span>`;
    opgaveZone.innerHTML = zin;
    antwoordenContainer.innerHTML = "";
    setTimeout(() => {
      huidigeIndex++;
      toonVolgende();
    }, 1700);
    return;
  }

  huidigOpgave = opg;
  opgaveZone.innerHTML = `<span>${huidigOpgave.vraag} = </span><span id="dropvak" class="dropvak">...</span>`;
  toonAntwoorden(huidigOpgave.juist);
}

// --- CORRECTE TOONANTWOORDEN FUNCTIE (voor klikbare antwoorden) ---
function toonAntwoorden(juistAntwoord) {
  antwoordenContainer.innerHTML = ""; // Maakt vorige antwoorden leeg
  const opties = [juistAntwoord];
  while (opties.length < 3) {
    const fout = Math.floor(Math.random() * 21);
    if (!opties.includes(fout)) opties.push(fout);
  }
  opties.sort(() => Math.random() - 0.5); // Schudt de opties

  opties.forEach(antwoordNummer => {
    const el = document.createElement("div");
    el.className = "antwoord";
    el.textContent = antwoordNummer;
    el.dataset.value = antwoordNummer;

    // iPad: snellere, betrouwbare tik (zonder 300ms delay)
    el.style.touchAction = 'manipulation';

    // iPad-proof: één pointer-event (geen dubbele click/touch)
    el.addEventListener("pointerup", (e) => {
      e.preventDefault();
      verwerkGekozenAntwoord(antwoordNummer, el);
    }, { passive: false });

    antwoordenContainer.appendChild(el);
  });
}

// --- CORRECTE VERWERKGEKOZENANTWOORD FUNCTIE ---
function verwerkGekozenAntwoord(gekozenNummer, antwoordElement) {
  const dropvak = document.getElementById("dropvak");
  if (!dropvak || !huidigOpgave) {
    console.error("Dropvak of huidigOpgave niet gevonden in verwerkGekozenAntwoord");
    return;
  }

  const gekozen = parseInt(gekozenNummer);
  const juist = huidigOpgave.juist;

  const alleAntwoordOpties = document.querySelectorAll(".antwoord");
  alleAntwoordOpties.forEach(optie => optie.style.pointerEvents = 'none');

  if (gekozen === juist) {
    dropvak.textContent = gekozen;
    if (antwoordElement) {
      antwoordElement.style.backgroundColor = "#a7d7c5";
    }
    if (!herhaling) {
      ronde1Score++;
      const tafel = huidigOpgave.tafel;
      if (!ronde1PerTafel[tafel]) ronde1PerTafel[tafel] = 0;
      ronde1PerTafel[tafel]++;
    } else {
      ronde2Score++;
    }
    setTimeout(() => {
      huidigeIndex++;
      toonVolgende();
    }, 800);
  } else {
    if (antwoordElement) {
      antwoordElement.style.backgroundColor = "#ff6b6b";
    }
    dropvak.textContent = gekozen;
    fouten.push(huidigOpgave);

    ballon.textContent = `Het juiste antwoord is ${juist}`;
    ballon.style.display = "block";
    
    const opgaveZoneRect = opgaveZone.getBoundingClientRect();
    const antwoordenContainerRect = antwoordenContainer.getBoundingClientRect();
    ballon.style.top = (opgaveZoneRect.bottom + window.scrollY + 10) + 'px'; 
    ballon.style.left = (antwoordenContainerRect.left + window.scrollX) + 'px';
    ballon.style.right = 'auto';

    setTimeout(() => {
      ballon.style.display = "none";
      huidigeIndex++;
      toonVolgende();
    }, 1800);
  }
}

/* --- OUDE DRAG-AND-DROP LISTENERS (NU ALS COMMENTAAR) ---
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
      const tafel = huidigOpgave.tafel;
      if (!ronde1PerTafel[tafel]) ronde1PerTafel[tafel] = 0;
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
*/

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
  antwoordenContainer.innerHTML = "";
  opgaveZone.innerHTML = "";

  const feedbackHTML = document.createElement("div");
  feedbackHTML.style.fontSize = "1em";
  feedbackHTML.style.color = "white";
  feedbackHTML.style.margin = "0";
  feedbackHTML.innerHTML = `
    <p>
      <strong>Score ronde 1:</strong> ${ronde1Score} / ${aantalEchteOpgaven()}<br>
      <strong>Score ronde 2:</strong> ${ronde2Score} / ${foutenEersteRonde.length}<br><br>
      ${ronde1Score === aantalEchteOpgaven()
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

  if (ronde1Score === aantalEchteOpgaven()) {
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

    // Scroll naar de knop als deze buiten beeld zou vallen
    setTimeout(() => {
      knopContainer.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 200);
  }

  const overzicht = document.getElementById("tafels-lijst");
  if (overzicht) {
    overzicht.innerHTML = "";
    gekozenTafels.forEach(tafel => {
      const badge = document.createElement("span");
      badge.className = "tafelbadge";
      const correct = ronde1PerTafel[tafel] || 0;
      const goed = correct === 11;
      badge.textContent = `×${tafel} ${goed ? '✅' : '❌'}`;
      overzicht.appendChild(badge);
    });
  }
}

startOefeningen();

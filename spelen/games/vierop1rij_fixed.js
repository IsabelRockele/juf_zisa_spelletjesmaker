// --- GLOBALE VARIABELEN & CONSTANTEN ---
let soort = null;
let tafels = [];
let spelerAantal = 0;
let actieveSpeler = 1;
let juisteAntwoord = 0;
let vorigeOpgave = "";

const keuzeScherm = document.getElementById("keuzeScherm");
const spelScherm = document.getElementById("spelScherm");
const startKnop = document.getElementById("startSpel");
const kolomKnoppen = document.querySelectorAll(".kolom-knop");
const antwoordInput = document.getElementById("antwoordInput");
const controleerBtn = document.getElementById("controleerBtn");

// iPad-proof: geen keyboard en nooit focus vasthouden
antwoordInput.readOnly = true;
antwoordInput.setAttribute('inputmode', 'none');
antwoordInput.setAttribute('autocomplete', 'off');
antwoordInput.setAttribute('autocorrect', 'off');
antwoordInput.setAttribute('autocapitalize', 'off');
antwoordInput.addEventListener('focus', () => antwoordInput.blur());

// --- DEEL 1: KEUZESCHERM LOGICA ---
function checkKeuzes() {
  const typeGekozen = soort !== null;
  const tafelsGekozen = tafels.length > 0;
  const spelersGekozen = spelerAantal > 0;

  if (typeGekozen) document.getElementById("meldingType").style.display = "none";
  if (tafelsGekozen) document.getElementById("meldingTafels").style.display = "none";
  if (spelersGekozen) document.getElementById("meldingSpelers").style.display = "none";

  if (typeGekozen && tafelsGekozen && spelersGekozen) {
    startKnop.disabled = false;
    startKnop.textContent = "Start spel";
  } else {
    startKnop.disabled = true;
    startKnop.textContent = "Maak eerst je keuzes";
  }
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
  keuzeScherm.style.display = "none";
  spelScherm.style.display = "block";
  resetSpel();
});

// --- DEEL 2: SPEL LOGICA ---
function resetSpel() {
  verwijderWinAnimatie();
  document.querySelector(".spel-inhoud").style.display = "flex";

  document.querySelector('#speler2Zone h3').textContent = spelerAantal === 1 ? 'Speler 2 (Computer)' : 'Speler 2';

  document.querySelectorAll("#bordContainer .vakje").forEach(vak => {
    vak.innerHTML = "";
    vak.style.animation = "";
  });

  document.querySelectorAll(".fiche-cirkel").forEach(c => c.innerHTML = '');
  antwoordInput.value = "";
  actieveSpeler = 1;

  startVolgendeBeurt();
  toggleKolomKnoppen(false);
}

function startVolgendeBeurt() {
  genereerOefening();
  updateActieveSpelerUI();
}

function toggleKolomKnoppen(enabled) {
  kolomKnoppen.forEach(knop => knop.disabled = !enabled);
}

function genereerOefening() {
  let nieuwOpgave = "";
  let tafel, getal;
  let opgaveGemaakt = false;

  while (!opgaveGemaakt) {
    let gekozenSoort = soort;
    if (soort === 'beide') gekozenSoort = Math.random() < 0.5 ? 'maal' : 'delen';

    if (gekozenSoort === 'delen') {
      const deelTafels = tafels.filter(t => t !== 0);
      if (deelTafels.length === 0) {
        if (soort === 'delen') {
          document.getElementById("oefeningContainer").textContent = "Kies een tafel > 0";
          antwoordInput.disabled = true;
          controleerBtn.disabled = true;
          return;
        }
        gekozenSoort = 'maal';
      } else {
        tafel = deelTafels[Math.floor(Math.random() * deelTafels.length)];
        getal = Math.floor(Math.random() * 10) + 1;
        juisteAntwoord = getal;
        nieuwOpgave = `${tafel * getal} ÷ ${tafel}`;
      }
    }

    if (gekozenSoort === 'maal') {
      tafel = tafels[Math.floor(Math.random() * tafels.length)];
      getal = Math.floor(Math.random() * 11);
      juisteAntwoord = tafel * getal;
      nieuwOpgave = `${getal} × ${tafel}`;
    }

    if (nieuwOpgave && nieuwOpgave !== vorigeOpgave) opgaveGemaakt = true;
  }

  vorigeOpgave = nieuwOpgave;
  document.getElementById("oefeningContainer").textContent = nieuwOpgave;

  if (spelerAantal === 2 || actieveSpeler === 1) {
    antwoordInput.value = "";
    antwoordInput.disabled = false;
    controleerBtn.disabled = false;
  }
}

function updateActieveSpelerUI() {
  const spelerZones = [document.getElementById("speler1Zone"), document.getElementById("speler2Zone")];

  spelerZones.forEach((zone, index) => {
    const spelerNummer = index + 1;
    const isActive = spelerNummer === actieveSpeler;
    zone.style.opacity = isActive ? "1" : "0.5";
    zone.style.backgroundColor = isActive
      ? (spelerNummer === 1 ? '#ffd54f' : '#ef9a9a')
      : (spelerNummer === 1 ? '#fff3b0' : '#ffd6d6');

    const toetsenbordContainer = zone.querySelector(".toetsenbord");
    toetsenbordContainer.innerHTML = "";
    if (isActive && (spelerAantal === 2 || spelerNummer === 1)) {
      genereerToetsenbord(toetsenbordContainer);
    }
  });

  if (spelerAantal === 1 && actieveSpeler === 2) {
    speelComputerBeurt();
  } else {
    // iPad-proof: zeker geen toetsenbord openen
    antwoordInput.blur();
  }
}

function genereerToetsenbord(container) {
  container.innerHTML = "";
  const layout = [['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['←', '0', 'OK']];
  layout.forEach(rij => {
    const rijDiv = document.createElement("div");
    rijDiv.style.display = "flex";
    rijDiv.style.justifyContent = "center";
    rij.forEach(item => {
      const knop = document.createElement("button");
      knop.textContent = item;
      knop.style.cssText = "margin:3px; width:50px; height:40px; font-size:1.2em;";
      // iOS: sneller & stabiel
      knop.style.touchAction = 'manipulation';
      // iPad-proof: één pointer-event (geen click/touch-dubbel)
      knop.addEventListener('pointerup', (e) => {
        e.preventDefault();
        if (item === '←') antwoordInput.value = antwoordInput.value.slice(0, -1);
        else if (item === 'OK') controleerBtn.click();
        else if (antwoordInput.value.length < 3) antwoordInput.value += item;
      }, { passive: false });
      container.appendChild(knop);
    });
    container.appendChild(rijDiv);
  });
}

controleerBtn.addEventListener("click", () => {
  if (antwoordInput.value.trim() === "") return;
  const input = parseInt(antwoordInput.value.trim());
  const isJuist = input === juisteAntwoord;

  toonFeedbackBijSpeler(actieveSpeler, isJuist);
  controleerBtn.disabled = true;
  antwoordInput.disabled = true;

  if (isJuist) {
    toonFicheBijSpeler(actieveSpeler);
    toggleKolomKnoppen(true);
  } else {
    setTimeout(() => {
      actieveSpeler = actieveSpeler === 1 ? 2 : 1;
      startVolgendeBeurt();
    }, 2000);
  }
});

function toonFeedbackBijSpeler(speler, juist) {
  const zone = document.querySelector(`#speler${speler}Zone`);
  const img = zone.querySelector("img");
  const tekst = zone.querySelector(".zisa-tekst");

  img.src = juist ? "tafels_afbeeldingen/blij.png" : "tafels_afbeeldingen/droevig.png";
  tekst.textContent = juist ? "Joepie!!" : "Oeps...";
  img.style.display = "block";

  setTimeout(() => {
    img.style.display = "none";
    tekst.textContent = "";
  }, 1800);
}

// --- DEEL 3: BORD LOGICA (VOOR MENSELIJKE SPELERS) ---
function toonFicheBijSpeler(speler) {
  const zone = document.querySelector(`#speler${speler}Zone .fiche-cirkel`);
  zone.innerHTML = "";
  const fiche = document.createElement("div");
  fiche.className = "kleur-fiche";
  fiche.style.cssText = `width:60px; height:60px; border-radius:50%; background-color:${speler === 1 ? "yellow" : "red"};`;
  fiche.dataset.kleur = speler === 1 ? "yellow" : "red";
  zone.appendChild(fiche);
}

kolomKnoppen.forEach((knop, index) => {
  // iPad-proof: pointerup i.p.v. click
  knop.style.touchAction = 'manipulation';
  knop.addEventListener("pointerup", (e) => {
    e.preventDefault();

    const ficheNode = document.querySelector(`#speler${actieveSpeler}Zone .fiche-cirkel div`);
    if (!ficheNode) return;

    toggleKolomKnoppen(false);

    const kleur = ficheNode.dataset.kleur;
    const kolom = index;
    const cellen = document.querySelectorAll("#bordContainer .vakje");
    let geplaatst = false;

    for (let rij = 5; rij >= 0; rij--) {
      const celIndex = rij * 7 + kolom;
      const cel = cellen[celIndex];
      if (!cel.hasChildNodes()) {
        cel.appendChild(ficheNode.cloneNode(true));
        document.querySelector(`#speler${actieveSpeler}Zone .fiche-cirkel`).innerHTML = "";
        geplaatst = true;

        if (!controleerWinst(rij, kolom, kleur)) {
          actieveSpeler = actieveSpeler === 1 ? 2 : 1;
          startVolgendeBeurt();
        }
        break;
      }
    }
    if (!geplaatst) toggleKolomKnoppen(true);
  }, { passive: false });
});

function controleerWinst(rij, kolom, kleur) {
  const getCel = (r, k) => (r >= 0 && r <= 5 && k >= 0 && k <= 6) ? document.querySelectorAll("#bordContainer .vakje")[r * 7 + k] : null;
  const richtingen = [{ dr: 0, dk: 1 }, { dr: 1, dk: 0 }, { dr: 1, dk: 1 }, { dr: 1, dk: -1 }];

  for (let { dr, dk } of richtingen) {
    let ketting = 1;
    for (let i = 1; i < 4; i++) {
      const cel = getCel(rij + i * dr, kolom + i * dk);
      if (cel && cel.firstChild && cel.firstChild.dataset.kleur === kleur) ketting++; else break;
    }
    for (let i = 1; i < 4; i++) {
      const cel = getCel(rij - i * dr, kolom - i * dk);
      if (cel && cel.firstChild && cel.firstChild.dataset.kleur === kleur) ketting++; else break;
    }

    if (ketting >= 4) {
      for (let i = -3; i < 4; i++) {
        const cel = getCel(rij + i * dr, kolom + i * dk);
        if (cel && cel.firstChild && cel.firstChild.dataset.kleur === kleur) {
          cel.style.animation = "flitsen 0.4s infinite alternate";
        }
      }
      setTimeout(() => toonWinnendeSlotfase(kleur), 4000);
      return true;
    }
  }
  return false;
}

// --- DEEL 4: COMPUTERSPELER & SLOTFASE ---
function speelComputerBeurt() {
  toggleKolomKnoppen(false);
  antwoordInput.disabled = true;

  setTimeout(() => { // "Denktijd"
    const computerIsCorrect = Math.random() < 0.75; // 75% kans op juist
    let computerAntwoord;

    if (computerIsCorrect) {
      computerAntwoord = juisteAntwoord;
    } else {
      const afwijking = Math.random() < 0.5 ? 1 : -1;
      computerAntwoord = Math.max(0, juisteAntwoord + afwijking);
      if (computerAntwoord === juisteAntwoord) computerAntwoord++;
    }

    antwoordInput.value = computerAntwoord;
    toonFeedbackBijSpeler(2, computerIsCorrect);

    if (computerIsCorrect) {
      toonFicheBijSpeler(2);
      setTimeout(plaatsComputerFiche, 1500);
    } else {
      setTimeout(() => {
        actieveSpeler = 1;
        startVolgendeBeurt();
      }, 2000);
    }
  }, 1500);
}

function plaatsComputerFiche() {
  const cellen = document.querySelectorAll("#bordContainer .vakje");
  const geldigeKolommen = [];
  for (let i = 0; i < 7; i++) {
    if (!cellen[i].hasChildNodes()) geldigeKolommen.push(i);
  }

  if (geldigeKolommen.length > 0) {
    const kolom = geldigeKolommen[Math.floor(Math.random() * geldigeKolommen.length)];
    const ficheNode = document.querySelector("#speler2Zone .fiche-cirkel div");
    if (!ficheNode) return;

    for (let rij = 5; rij >= 0; rij--) {
      const celIndex = rij * 7 + kolom;
      const cel = cellen[celIndex];
      if (!cel.hasChildNodes()) {
        cel.appendChild(ficheNode.cloneNode(true));
        document.querySelector("#speler2Zone .fiche-cirkel").innerHTML = "";

        if (!controleerWinst(rij, kolom, "red")) {
          actieveSpeler = 1;              // ⇐ wissel naar speler 1
          startVolgendeBeurt();
        }
        return;
      }
    }

    // Kolom toch vol? Wissel sowieso van speler.
    actieveSpeler = 1;
    startVolgendeBeurt();

  } else {
    // Bord vol: ook hier beurt doorgeven.
    actieveSpeler = 1;
    startVolgendeBeurt();
  }
}


function toonWinnendeSlotfase(kleur) {
  document.querySelector(".spel-inhoud").style.display = "none";
  const zisa = document.createElement("img");
  zisa.src = "tafels_afbeeldingen/zisa_wint.png";
  zisa.style.cssText = "position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); z-index:1001; height:350px;";
  zisa.id = "zisaWin";
  document.body.appendChild(zisa);

  for (let i = 0; i < 30; i++) {
    const fiche = document.createElement("div");
    fiche.className = "vallende-fiche";
    fiche.style.backgroundColor = kleur;
    fiche.style.left = Math.random() * 100 + "vw";
    fiche.style.animationDuration = (4 + Math.random() * 3) + "s";
    document.body.appendChild(fiche);
  }
}

function verwijderWinAnimatie() {
  const zisa = document.getElementById("zisaWin");
  if (zisa) zisa.remove();
  document.querySelectorAll(".vallende-fiche").forEach(fiche => fiche.remove());
}

document.getElementById("btn-opnieuw").addEventListener("click", resetSpel);

document.getElementById("btn-terug-spel").addEventListener("pointerup", (e) => {
  e.preventDefault();
  verwijderWinAnimatie();

  spelScherm.style.display = "none";
  keuzeScherm.style.display = "block";

  document.querySelectorAll(".keuze, .tafel, .spelers").forEach(btn => btn.classList.remove("active"));
  document.getElementById("meldingType").style.display = "block";
  document.getElementById("meldingTafels").style.display = "block";
  document.getElementById("meldingSpelers").style.display = "block";

  soort = null; tafels = []; spelerAantal = 0;
  checkKeuzes();
}, { passive: false });

let gekozenTafels = JSON.parse(sessionStorage.getItem("tafels")) || [2];
let totaalAantalOefeningen = gekozenTafels.length > 4 ? 30 : 20;
let opgaven = [];
let huidigeIndex = 0;
let fouten = [];
let foutenEersteRonde = [];
let ronde1Score = 0;
let ronde2Score = 0;
let herhaling = false;
let huidigOpgave = null;

const opgaveZone = document.getElementById("opgave");
const invoerveld = document.getElementById("invoerveld");
const toetsenbord = document.getElementById("toetsenbord");
const feedback = document.getElementById("feedback");

// NIEUW: nooit iPad-toetsenbord tonen als het veld per ongeluk focus krijgt
invoerveld.addEventListener('focus', () => invoerveld.blur());

function genereerGemengdeOpgaven() {
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
  return alleOpgaven.slice(0, totaalAantalOefeningen);
}

function startOefeningen() {
  opgaven = genereerGemengdeOpgaven();
  huidigeIndex = 0;
  fouten = [];
  foutenEersteRonde = [];
  ronde1Score = 0;
  ronde2Score = 0;
  herhaling = false;
  feedback.innerHTML = "";
  toonVolgende();
}

function toonVolgende() {
  if (huidigeIndex >= opgaven.length) {
    if (!herhaling && fouten.length > 0) {
      foutenEersteRonde = [...fouten];
      opgaven = fouten;
      fouten = [];
      huidigeIndex = 0;
      herhaling = true;
      feedback.innerHTML = "We gaan nu de foutjes nog eens oefenen...";
      document.getElementById("opgave").textContent = "";
      document.getElementById("invoerveld").value = "";
      document.getElementById("invoerveld").style.display = "none";
      setTimeout(() => {
        feedback.innerHTML = "";
        toonVolgende();
      }, 1500);
    } else {
      toonFeedback();
    }
    return;
  }

  huidigOpgave = opgaven[huidigeIndex];
  invoerveld.style.display = "block";
  opgaveZone.textContent = huidigOpgave.vraag + " = ?";
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
  if (isNaN(antwoord)) return;

  const juist = huidigOpgave.juist;
  if (antwoord === juist) {
    if (!herhaling) ronde1Score++;
    else ronde2Score++;
  } else {
    fouten.push(huidigOpgave);
    ballon.textContent = `Het juiste antwoord is ${juist}`;
    ballon.style.display = 'block';
    setTimeout(() => { ballon.style.display = 'none'; }, 1500);
  }

  huidigeIndex++;
  toonVolgende();
}

function toonToetsenbord() {
  const toetsen = ["1","2","3","4","5","6","7","8","9","0","←","OK"];
  toetsen.forEach(t => {
    const knop = document.createElement("button");
    knop.className = "toets";
    knop.textContent = t;

    // NIEUW: iPad-proof – één pointer-event, geen click/touch-dubbel
    knop.addEventListener("pointerup", (e) => {
      e.preventDefault();
      toetsInvoegen(t);
    }, { passive: false });

    toetsenbord.appendChild(knop);
  });
}

function toonFeedback() {
  document.getElementById("opgave").textContent = "";
  document.getElementById("invoerveld").value = "";
  document.getElementById("invoerveld").style.display = "none";
  feedback.innerHTML = `
    <p style="font-size: 1.2em; color: white;">
      <strong>Score ronde 1:</strong> ${ronde1Score} / ${totaalAantalOefeningen}<br>
      <strong>Score ronde 2:</strong> ${ronde2Score} / ${foutenEersteRonde.length}<br><br>
      ${
        ronde1Score === opgaven.length
          ? "🎉 Je deed alles in één keer goed! Je mag naar Level 3."
          : "Goed geoefend! Oefen gerust nog een keer of probeer opnieuw."
      }
    </p>
  `;

  const knop = document.createElement("button");
  knop.textContent = "Level 3 ▶";
  knop.style.padding = "16px 32px";
  knop.style.fontSize = "1.6em";
  knop.style.marginTop = "15px";
  knop.style.backgroundColor = "#2e7d32";
  knop.style.color = "white";
  knop.style.border = "none";
  knop.style.borderRadius = "12px";
  knop.style.cursor = "pointer";

  if (ronde1Score === opgaven.length) {
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

    knop.addEventListener("click", () => {
      window.location.href = "level3.html";
    });
    const container = document.getElementById("knop-level3");
    container.innerHTML = "";
    container.appendChild(knop);

    setTimeout(() => {
      knop.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 200);
  }

  const overzicht = document.getElementById("tafels-lijst");
  if (overzicht) {
    overzicht.innerHTML = "";
    gekozenTafels.forEach(tafel => {
      const badge = document.createElement("span");
      badge.className = "tafelbadge";
      badge.textContent = `×${tafel} ${ronde1Score === opgaven.length ? '✅' : '❌'}`;
      overzicht.appendChild(badge);
    });
  }
}

function opnieuwOefenen() {
  document.getElementById("invoerveld").style.display = "block";
  startOefeningen();
}

function gaTerug() {
  window.location.href = "tafel_oefenen.html";
}

toonToetsenbord();
startOefeningen();

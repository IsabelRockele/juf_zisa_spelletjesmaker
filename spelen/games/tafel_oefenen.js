// JS voor tafel_oefenen.html – keuzescherm

document.addEventListener("DOMContentLoaded", function () {
  let gekozenType = null;
  let gekozenTafels = [];
  let gekozenLevel = null;

  const typeKnoppen = document.querySelectorAll(".keuze");
  const tafelKnoppen = document.querySelectorAll(".tafel");
  const levelKnoppen = document.querySelectorAll(".level");
  const startKnop = document.getElementById("startOefening");
  const terugKnop = document.getElementById("btn-terug");

  const meldingType = document.getElementById("meldingType");
  const meldingTafels = document.getElementById("meldingTafels");
  const meldingLevel = document.getElementById("meldingLevel");
  
  // AANGEPAST: De terugknop reageert nu slim op de vorige pagina
  terugKnop.addEventListener('click', () => {
    const referrer = document.referrer;
    // Standaard terugval naar tafel_overzicht.html
    let terugUrl = 'tafel_overzicht.html';

    // Controleer de referrer en stel de juiste terugUrl in
    if (referrer.includes('tafel_overzicht.html')) {
      terugUrl = 'tafel_overzicht.html'; // Verwijst naar algemeen overzicht
    } else if (referrer.includes('tafel3_overzicht.html')) {
      terugUrl = 'tafel3_overzicht.html'; // Verwijst specifiek naar tafel 3 overzicht
    } 
    // Voeg hier meer 'else if' statements toe voor andere specifieke overzichtspagina's
    // Bijvoorbeeld:
    // else if (referrer.includes('tafel4_overzicht.html')) {
    //   terugUrl = 'tafel4_overzicht.html';
    // }
    // Enzovoort voor elke specifieke tafeloverzichtspagina

    window.location.href = terugUrl; // Navigeer naar de bepaalde URL
  });
  // Einde aanpassing terugknop

  function checkKeuzes() {
    const allesGekozen = gekozenType && gekozenTafels.length > 0 && gekozenLevel;
    startKnop.disabled = !allesGekozen;
    startKnop.textContent = allesGekozen ? "Start oefening" : "Maak eerst je keuzes";
    startKnop.classList.toggle("actief", allesGekozen);
    startKnop.style.cursor = allesGekozen ? "pointer" : "not-allowed";

    meldingType.textContent = gekozenType ? "" : "Nog niet gekozen";
    meldingTafels.textContent = gekozenTafels.length > 0 ? "" : "Nog niet gekozen";
    meldingLevel.textContent = gekozenLevel ? "" : "Nog niet gekozen";
  }

  typeKnoppen.forEach(knop => {
    knop.addEventListener("click", function () {
      typeKnoppen.forEach(k => k.classList.remove("active"));
      this.classList.add("active");
      gekozenType = this.dataset.type;
      checkKeuzes();
    });
  });

  tafelKnoppen.forEach(knop => {
    knop.addEventListener("click", function () {
      const tafel = parseInt(this.dataset.tafel);
      this.classList.toggle("active");
      if (gekozenTafels.includes(tafel)) {
        gekozenTafels = gekozenTafels.filter(t => t !== tafel);
      } else {
        gekozenTafels.push(tafel);
      }
      checkKeuzes();
    });
  });

  levelKnoppen.forEach(knop => {
    knop.addEventListener("click", function () {
      levelKnoppen.forEach(k => k.classList.remove("active"));
      this.classList.add("active");
      gekozenLevel = parseInt(this.dataset.level);
      checkKeuzes();
    });
  });

  startKnop.addEventListener("click", function () {
    if (!gekozenType || gekozenTafels.length === 0 || !gekozenLevel) return;

    sessionStorage.setItem("tafel_type", gekozenType);
    sessionStorage.setItem("tafels", JSON.stringify(gekozenTafels));
    sessionStorage.setItem("tafel_level", gekozenLevel);

    if (gekozenLevel === 1) {
      window.location.href = "level1.html";
    } else if (gekozenLevel === 2) {
      window.location.href = "level2.html";
    } else if (gekozenLevel === 3) {
      window.location.href = "level3.html";
    }
  });

  checkKeuzes();
});
// splitsen_bibi.js - activeert startknop na keuze

document.addEventListener("DOMContentLoaded", () => {
  const keuzeKnoppen = document.querySelectorAll(".keuze");
  const startKnop = document.getElementById("startSpel");
  const melding = document.getElementById("meldingSplitsing");

  let gekozenMax = null;

  keuzeKnoppen.forEach(knop => {
    knop.addEventListener("click", () => {
      keuzeKnoppen.forEach(k => k.classList.remove("active"));
      knop.classList.add("active");
      gekozenMax = knop.dataset.max;

      startKnop.disabled = false;
      startKnop.textContent = "Start spel";
      startKnop.style.cursor = "pointer";
      melding.style.display = "none";
    });
  });

  startKnop.addEventListener("click", () => {
    if (!gekozenMax) {
      melding.style.display = "block";
      return;
    }
    window.location.href = `splits_bijenkorf.html?max=${gekozenMax}`;
  });
});
document.addEventListener("DOMContentLoaded", () => {
  let gekozenMax = null;

  document.querySelectorAll(".keuze").forEach(knop => {
    knop.addEventListener("click", () => {
      gekozenMax = knop.dataset.max;
      document.getElementById("meldingSplitsing").textContent = "Gekozen: tot " + gekozenMax;
      document.getElementById("startSpel").disabled = false;
    });
  });

  document.getElementById("startSpel").addEventListener("click", () => {
    if (gekozenMax) {
      window.location.href = `splits_bijenkorf.html?max=${gekozenMax}`;
    }
  });
});

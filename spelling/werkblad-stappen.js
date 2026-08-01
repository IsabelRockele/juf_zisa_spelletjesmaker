/* ==========================================================
   Stap-voor-staproute voor volledige werkbladen.
   De werkboekjesmodus behoudt zijn vrije, mengbare zijbalk.
   ========================================================== */
(function () {
  let huidigeStap = 1;
  let hoogsteStap = 1;
  let aantalVoorGenereren = 0;

  const $ = (selector) => document.querySelector(selector);
  const inWerkbladModus = () => document.body.classList.contains("modus-actief-werkblad");

  function gekozenCategorieen() {
    return window.SpellingZijbalk?.getAangevinkteCategorieIds?.() || [];
  }

  function gekozenCombinaties() {
    let totaal = 0;
    document.querySelectorAll("#oefenvorm-selector .zb-oef-checkbox:checked").forEach(cb => {
      const blok = cb.closest(".zb-oefenvorm");
      const niveaus = blok?.querySelectorAll(".zb-niveau-cb:checked").length || 0;
      totaal += blok?.querySelectorAll(".zb-niveau-cb").length ? niveaus : 1;
    });
    return totaal;
  }

  function werkbladAantal() {
    return document.querySelectorAll("#preview .werkblad").length;
  }

  function updateKnoppen() {
    const heeftDoel = gekozenCategorieen().length > 0;
    const naarWoorden = $("#wb-naar-woorden");
    if (naarWoorden) {
      naarWoorden.disabled = !heeftDoel;
      naarWoorden.textContent = heeftDoel
        ? "Keuze klaar — verder naar woorden →"
        : "Kies eerst een spellingdoel";
    }

    const aantal = gekozenCombinaties();
    const maak = $("#bundel-voeg-toe");
    if (maak && inWerkbladModus() && huidigeStap === 3) {
      maak.disabled = aantal === 0;
      const toevoegen = werkbladAantal() > 0;
      if (aantal <= 1) maak.textContent = toevoegen
        ? "＋ Voeg dit werkblad toe"
        : "📋 Maak volledig werkblad";
      else maak.textContent = toevoegen
        ? `＋ Voeg ${aantal} differentiatiebladen toe`
        : `📚 Maak ${aantal} differentiatiebladen`;
    }

    document.querySelectorAll("#wb-stappenbalk button").forEach(btn => {
      const stap = Number(btn.dataset.wbStap);
      btn.disabled = stap > hoogsteStap || (stap === 2 && !heeftDoel);
      btn.classList.toggle("actief", stap === huidigeStap);
      btn.classList.toggle("klaar", stap < huidigeStap);
    });
  }

  function toonStap(stap) {
    if (!inWerkbladModus()) return;
    huidigeStap = stap;
    hoogsteStap = Math.max(hoogsteStap, stap);

    const categorie = $("#zb-sec-categorie");
    const woorden = $("#zb-sec-woorden");
    const oefeningen = $("#zb-sec-oefenvormen");
    const opmaak = $("#zb-sec-schrijflijn");
    const acties = $("#modus-werkblad .actie-knoppen");
    const resultaat = $("#wb-resultaat-paneel");
    const intro = $("#modus-werkblad .zb-startintro");

    [categorie, woorden, oefeningen, opmaak].forEach(el => el?.classList.add("wb-stap-verborgen"));
    if (acties) acties.classList.add("wb-stap-verborgen");
    if (resultaat) resultaat.hidden = true;
    if (intro) intro.classList.toggle("wb-compact", stap > 1);

    if (stap === 1) {
      categorie?.classList.remove("wb-stap-verborgen");
      if (categorie) categorie.open = true;
    } else if (stap === 2) {
      woorden?.classList.remove("wb-stap-verborgen");
      if (woorden) woorden.open = true;
    } else if (stap === 3) {
      oefeningen?.classList.remove("wb-stap-verborgen");
      opmaak?.classList.remove("wb-stap-verborgen");
      acties?.classList.remove("wb-stap-verborgen");
      if (oefeningen) oefeningen.open = true;
      $("#bundel-voeg-toe")?.classList.remove("wb-resultaat-verborgen");
      $("#bewerken-toggle")?.classList.add("wb-resultaat-verborgen");
      $("#modus-werkblad .download-groep")?.classList.add("wb-resultaat-verborgen");
      $("#bundel-wis")?.classList.add("wb-resultaat-verborgen");
    } else if (stap === 4) {
      acties?.classList.remove("wb-stap-verborgen");
      if (resultaat) resultaat.hidden = false;
      $("#bundel-voeg-toe")?.classList.add("wb-resultaat-verborgen");
      $("#bewerken-toggle")?.classList.remove("wb-resultaat-verborgen");
      $("#modus-werkblad .download-groep")?.classList.remove("wb-resultaat-verborgen");
      $("#bundel-wis")?.classList.remove("wb-resultaat-verborgen");
    }

    updateKnoppen();
    $("#modus-werkblad .sidebar")?.scrollTo({ top: 0, behavior: "smooth" });
  }

  function deactiveerVoorWerkboekje() {
    ["#zb-sec-categorie", "#zb-sec-woorden", "#zb-sec-oefenvormen", "#zb-sec-schrijflijn", ".actie-knoppen"]
      .forEach(sel => document.querySelector(sel)?.classList.remove("wb-stap-verborgen"));
    $("#wb-stappenbalk")?.classList.add("wb-stappenbalk-verborgen");
    document.querySelectorAll(".wb-stap-nav").forEach(el => el.classList.add("wb-nav-verborgen"));
    $("#wb-resultaat-paneel")?.setAttribute("hidden", "");
    $("#bundel-voeg-toe")?.classList.remove("wb-resultaat-verborgen");
    $("#bewerken-toggle")?.classList.remove("wb-resultaat-verborgen");
    $("#modus-werkblad .download-groep")?.classList.remove("wb-resultaat-verborgen");
  }

  function synchroniseerModus() {
    if (inWerkbladModus()) {
      $("#wb-stappenbalk")?.classList.remove("wb-stappenbalk-verborgen");
      document.querySelectorAll(".wb-stap-nav").forEach(el => el.classList.remove("wb-nav-verborgen"));
      toonStap(huidigeStap);
    } else {
      deactiveerVoorWerkboekje();
    }
  }

  function init() {
    $("#wb-naar-woorden")?.addEventListener("click", () => {
      // Een nieuwe route mag geen oefening uit een vorig werkblad meenemen.
      window.SpellingZijbalk?.wisOefenkeuze?.();
      toonStap(2);
    });
    $("#wb-terug-doel")?.addEventListener("click", () => toonStap(1));
    $("#wb-naar-oefening")?.addEventListener("click", () => toonStap(3));
    $("#wb-terug-woorden")?.addEventListener("click", () => toonStap(2));

    $("#wb-stappenbalk")?.addEventListener("click", e => {
      const btn = e.target.closest("button[data-wb-stap]");
      if (!btn || btn.disabled) return;
      toonStap(Number(btn.dataset.wbStap));
    });

    document.addEventListener("change", e => {
      if (!inWerkbladModus()) return;
      if (e.target.closest("#hoofdgroep-selector") || e.target.closest("#oefenvorm-selector")) {
        setTimeout(updateKnoppen, 0);
      }
    });
    window.addEventListener("spelling:woorden-gewijzigd", updateKnoppen);

    // Capture draait vóór de bestaande generator-handler en bewaart dus het
    // echte aantal bladen van vóór deze klik.
    $("#bundel-voeg-toe")?.addEventListener("click", () => {
      if (inWerkbladModus()) aantalVoorGenereren = werkbladAantal();
    }, true);

    $("#bundel-voeg-toe")?.addEventListener("click", () => {
      if (!inWerkbladModus()) return;
      const gevraagd = gekozenCombinaties();
      setTimeout(() => {
        const toegevoegd = werkbladAantal() - aantalVoorGenereren;
        if (toegevoegd <= 0) return;
        const titel = $("#wb-resultaat-titel");
        const tekst = $("#wb-resultaat-tekst");
        if (titel) titel.textContent = toegevoegd === 1 ? "Je werkblad is klaar" : `${toegevoegd} differentiatiebladen zijn klaar`;
        if (tekst) tekst.textContent = gevraagd > 1
          ? "Bekijk de niveaus rechts. Je kunt alles samen of per niveau downloaden."
          : "Bekijk het volledige werkblad rechts en download de leerlingversie of oplossingen.";
        toonStap(4);
      }, 80);
    });

    $("#wb-nog-een")?.addEventListener("click", () => {
      // Behoud het spellingdoel en woordenpakket, maar laat de leerkracht
      // bewust een andere oefenvorm en gewenste niveaus kiezen.
      window.SpellingZijbalk?.wisOefenkeuze?.();
      toonStap(3);
    });
    $("#wb-nieuw-doel")?.addEventListener("click", () => {
      window.SpellingZijbalk?.reset?.();
      window.SpellingWoordenkiezer?.reset?.();
      hoogsteStap = 1;
      toonStap(1);
    });

    document.addEventListener("click", e => {
      if (e.target.closest(".modus-kaart") || e.target.closest("#modus-wisselen")) {
        setTimeout(synchroniseerModus, 0);
      }
    });
    window.addEventListener("spelling:herhaling-actief", () => setTimeout(deactiveerVoorWerkboekje, 0));

    synchroniseerModus();
    updateKnoppen();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();

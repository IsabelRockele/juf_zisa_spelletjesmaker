/* ==========================================================
   Stap-voor-staproute voor volledige werkbladen.
   De werkboekjesmodus behoudt zijn vrije, mengbare zijbalk.
   ========================================================== */
(function () {
  const LS_STAP = "spelling-werkblad-huidige-stap-v1";
  let huidigeStap = 1;
  let hoogsteStap = 1;
  let aantalVoorGenereren = 0;

  const $ = (selector) => document.querySelector(selector);
  const inWerkbladModus = () => document.body.classList.contains("modus-actief-werkblad");

  function gekozenCategorieen() {
    return window.SpellingZijbalk?.getAangevinkteCategorieIds?.() || [];
  }

  /* Deze doelen bouwen hun materiaal volledig met zinnen. De bibliotheekitems
     zijn alleen technische keuzes, geen woordenpakket om te controleren. */
  function slaatWoordenStapOver() {
    const zinDoelen = new Set([
      "leestekens-eind-g1", "leestekens-binnen-g1",
      "hoofdletters-g2", "leestekens-eind-g2", "leestekens-binnen-g2",
      "werkwoordstijden-mix-g2"
    ]);
    const gekozen = gekozenCategorieen();
    return gekozen.length > 0 && gekozen.every(id => zinDoelen.has(id));
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

  function updateGekozenDoelenKader() {
    const vak = $("#wb-oef-doelen");
    if (!vak) return;
    const ids = gekozenCategorieen();
    const graad = window.SpellingZijbalk?.getActieveGraad?.() || 1;
    const data = window.SpellingWoordenbibliotheek?.[`graad${graad}`] || {};
    const namen = ids.map(id => data[id]?.naam || id);
    if (!namen.length) {
      vak.innerHTML = "";
      vak.hidden = true;
      return;
    }
    vak.hidden = false;
    const meerdere = namen.length > 1;
    vak.classList.toggle("meerdere", meerdere);
    vak.innerHTML = `<div class="wb-oef-doelen-kop"><strong>Je maakt oefeningen voor:</strong><button id="wb-doelen-aanpassen" type="button">Keuze aanpassen</button></div>
      <div class="wb-oef-doelen-tags">${namen.map(naam => `<span>${naam}</span>`).join("")}</div>
      ${meerdere ? '<p>Je hebt meerdere doelen gekozen. Daarom zie je hieronder ook meerdere passende oefenvormen.</p>' : ''}`;
    $("#wb-doelen-aanpassen")?.addEventListener("click", () => toonStap(1));
  }

  function updateKnoppen() {
    const heeftDoel = gekozenCategorieen().length > 0;
    const woordenOverslaan = slaatWoordenStapOver();
    const introTitel = $("#modus-werkblad .zb-startintro strong");
    if (introTitel) introTitel.textContent = woordenOverslaan
      ? "Maak materiaal in drie korte stappen"
      : "Maak materiaal in vier korte stappen";
    const oefeningStapNr = $("#wb-stappenbalk button[data-wb-stap='3'] span");
    const resultaatStapNr = $("#wb-stappenbalk button[data-wb-stap='4'] span");
    const oefeningSectieNr = $("#zb-sec-oefenvormen .zb-nr");
    if (oefeningStapNr) oefeningStapNr.textContent = woordenOverslaan ? "2" : "3";
    if (resultaatStapNr) resultaatStapNr.textContent = woordenOverslaan ? "3" : "4";
    if (oefeningSectieNr) oefeningSectieNr.textContent = woordenOverslaan ? "2" : "3";
    const naarWoorden = $("#wb-naar-woorden");
    if (naarWoorden) {
      naarWoorden.disabled = !heeftDoel;
      naarWoorden.textContent = heeftDoel
        ? (slaatWoordenStapOver() ? "Keuze klaar — verder naar oefening →" : "Keuze klaar — verder naar woorden →")
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
      btn.hidden = stap === 2 && woordenOverslaan;
      btn.disabled = stap > hoogsteStap || (stap === 2 && (!heeftDoel || woordenOverslaan));
      btn.classList.toggle("actief", stap === huidigeStap);
      btn.classList.toggle("klaar", stap < huidigeStap);
    });
    updateGekozenDoelenKader();
  }

  function toonStap(stap) {
    if (!inWerkbladModus()) return;
    huidigeStap = stap;
    hoogsteStap = Math.max(hoogsteStap, stap);
    try { sessionStorage.setItem(LS_STAP, String(stap)); } catch (_) {}

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
      if (slaatWoordenStapOver()) {
        toonStap(3);
        return;
      }
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
      // Bij een herinitialisatie van de zijbalk of een korte moduswissel mag
      // de leerkracht niet onverwacht terugvallen naar stap 1. Herstel de
      // laatst bereikte werkbladstap, behalve wanneer zij bewust een nieuw
      // spellingdoel startte (dan is de bewaarde stap al verwijderd/1).
      try {
        const bewaard = Number(sessionStorage.getItem(LS_STAP));
        if (gekozenCategorieen().length > 0 && bewaard >= 2 && bewaard <= 3) {
          huidigeStap = bewaard;
          hoogsteStap = Math.max(hoogsteStap, bewaard);
        }
      } catch (_) {}
      $("#wb-stappenbalk")?.classList.remove("wb-stappenbalk-verborgen");
      document.querySelectorAll(".wb-stap-nav").forEach(el => el.classList.remove("wb-nav-verborgen"));
      toonStap(huidigeStap);
    } else {
      deactiveerVoorWerkboekje();
    }
  }

  function init() {
    // Herstel de route na een onbedoelde herinitialisatie of paginaverversing.
    // Stap 4 wordt niet hersteld omdat de preview zelf niet bewaard wordt.
    try {
      const bewaard = Number(sessionStorage.getItem(LS_STAP));
      if (gekozenCategorieen().length > 0 && bewaard >= 2 && bewaard <= 3) {
        huidigeStap = bewaard;
        hoogsteStap = bewaard;
      }
    } catch (_) {}
    $("#wb-naar-woorden")?.addEventListener("click", () => {
      // Een nieuwe route mag geen oefening uit een vorig werkblad meenemen.
      window.SpellingZijbalk?.wisOefenkeuze?.();
      toonStap(slaatWoordenStapOver() ? 3 : 2);
    });
    $("#wb-terug-doel")?.addEventListener("click", () => toonStap(1));
    $("#wb-naar-oefening")?.addEventListener("click", () => toonStap(3));
    $("#wb-terug-woorden")?.addEventListener("click", () => toonStap(slaatWoordenStapOver() ? 1 : 2));

    $("#wb-stappenbalk")?.addEventListener("click", e => {
      const btn = e.target.closest("button[data-wb-stap]");
      if (!btn || btn.disabled) return;
      toonStap(Number(btn.dataset.wbStap));
    });

    document.addEventListener("change", e => {
      if (!inWerkbladModus()) return;
      // De oefenvorm-handler tekent zijn blok meteen opnieuw. Daardoor kan
      // het oorspronkelijke checkbox-element hier al losstaan van de
      // container. Herken de checkbox daarom ook rechtstreeks.
      if (e.target.closest("#hoofdgroep-selector")
          || e.target.closest("#oefenvorm-selector")
          || e.target.matches(".zb-oef-checkbox, .zb-niveau-cb")) {
        setTimeout(updateKnoppen, 0);
      }
    });
    window.addEventListener("spelling:woorden-gewijzigd", updateKnoppen);
    window.addEventListener("spelling:doel-gewijzigd", updateKnoppen);

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
      try { sessionStorage.removeItem(LS_STAP); } catch (_) {}
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

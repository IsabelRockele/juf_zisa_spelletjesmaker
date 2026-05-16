/* ==========================================================
   weekdictee-paneel.js
   
   Beheert het aparte weekdictee-paneel (modus "weekdictee").
   
   UI-flow (eenvoudig, 3 stappen):
   1. Graad-keuze
   2. Categorie-keuze (vereenvoudigd — alleen aangevinkte cats sturen
      filter naar de woordenkiezer)
   3. Woorden kiezen via bestaande woordenkiezer-modal
   
   Vernieuwen + Downloaden gebeurt direct vanuit dit paneel. Het paneel
   hergebruikt de bestaande modules/weekdictee.js voor de genereer-logica
   en de woordenkiezer voor het selecteren van woorden.
   
   State persistentie via localStorage:
   - actieve graad (gedeeld met zijbalk-state)
   - aangevinkte categorieën (gedeeld met zijbalk-state)
   - lijnhoogte (klein/middel)
   ========================================================== */

window.SpellingWeekdicteePaneel = (function() {

  /* ---------- LocalStorage keys (gedeeld met zijbalk waar mogelijk) ---------- */
  const LS_GRAAD = "spelling-zb-graad-v1";          // zelfde als zijbalk
  const LS_CATEGORIEEN = "spelling-zb-categorieen-v1"; // zelfde als zijbalk
  const LS_WD_LIJNHOOGTE = "spelling-wd-lijnhoogte-v1";
  const LS_WD_LIJNTYPE = "spelling-wd-lijntype-v1";
  const LS_WD_MET_ZINNEN = "spelling-wd-met-zinnen-v1";

  /* ---------- State ---------- */
  let actieveGraad = 1;
  let aangevinkteCategorieen = {};   // { 1: Set<string>, 2: Set<string>, ... }
  let lijnhoogte = "klein";          // klein | middel — bij weekdictee is klein de standaard
  let lijntype = "vier";             // vier | dubbel | enkel
  let metZinnen = true;              // 1 zin per dag onderaan ja/nee
  let bewerkAan = false;             // bewerk-modus aan (contenteditable)
  let wijzigingen = {};              // { 'wd-w-ma-0': 'aangepaste tekst', ... }
  let geinitialiseerd = false;

  /* De preview toont altijd het DICTEERBLAD (met woorden + zinnen).
     Dat is wat de juf nodig heeft om aan te passen voor ze uitdicteert.
     Het leerling-blad is gewoon hetzelfde formaat maar zonder de woorden,
     en wordt enkel bij de "Leerling-blad"-download gegenereerd. */

  /* ---------- LocalStorage ---------- */
  function laadState() {
    try {
      actieveGraad = parseInt(localStorage.getItem(LS_GRAAD) || "1", 10);
    } catch (e) { actieveGraad = 1; }
    
    try {
      const raw = localStorage.getItem(LS_CATEGORIEEN);
      if (raw) {
        const obj = JSON.parse(raw);
        aangevinkteCategorieen = {};
        for (const [g, lijst] of Object.entries(obj)) {
          aangevinkteCategorieen[g] = new Set(lijst);
        }
      }
    } catch (e) { /* leeg */ }

    try {
      const h = localStorage.getItem(LS_WD_LIJNHOOGTE);
      if (h === "klein" || h === "middel") lijnhoogte = h;
    } catch (e) { /* default */ }

    try {
      const t = localStorage.getItem(LS_WD_LIJNTYPE);
      if (t === "vier" || t === "dubbel" || t === "enkel") lijntype = t;
    } catch (e) { /* default */ }

    try {
      const mz = localStorage.getItem(LS_WD_MET_ZINNEN);
      if (mz === "ja" || mz === "nee") metZinnen = (mz === "ja");
    } catch (e) { /* default */ }
  }

  function bewaarState() {
    try {
      localStorage.setItem(LS_GRAAD, String(actieveGraad));
      const catObj = {};
      for (const [g, set] of Object.entries(aangevinkteCategorieen)) {
        catObj[g] = [...set];
      }
      localStorage.setItem(LS_CATEGORIEEN, JSON.stringify(catObj));
      localStorage.setItem(LS_WD_LIJNHOOGTE, lijnhoogte);
      localStorage.setItem(LS_WD_LIJNTYPE, lijntype);
      localStorage.setItem(LS_WD_MET_ZINNEN, metZinnen ? "ja" : "nee");
    } catch (e) { /* private mode */ }
  }

  function getAangevinkteCats() {
    if (!aangevinkteCategorieen[actieveGraad]) {
      aangevinkteCategorieen[actieveGraad] = new Set();
    }
    return aangevinkteCategorieen[actieveGraad];
  }

  /* ---------- Render: graad-tabs (paneel-eigen) ---------- */
  function renderGraadTabs() {
    const container = document.querySelector("#wd-paneel-graad-tabs");
    if (!container) return;
    const wb = window.SpellingWoordenbibliotheek;
    
    [1, 2, 3].forEach(g => {
      const tab = container.querySelector(`[data-graad="${g}"]`);
      if (!tab) return;
      const heeft = wb && wb.graadHeeftWoorden(g);
      tab.classList.toggle("actief", g === actieveGraad);
      tab.disabled = !heeft;
    });
  }

  /* ---------- Render: categorie-keuze ---------- */
  function renderCategorieKeuze() {
    const container = document.querySelector("#wd-paneel-categorieen");
    if (!container) return;

    const wb = window.SpellingWoordenbibliotheek;
    if (!wb || !wb.graadHeeftWoorden(actieveGraad)) {
      container.innerHTML = `
        <p class="wd-paneel-leeg">
          Graad ${actieveGraad} is nog niet beschikbaar.
        </p>`;
      return;
    }

    const wasOpen = new Set();
    container.querySelectorAll("details.wd-hoofdgroep[open]").forEach(d => {
      if (d.dataset.hoofdgroep) wasOpen.add(d.dataset.hoofdgroep);
    });

    const data = wb.categorieenPerHoofdgroep(actieveGraad);
    const aangevinkt = getAangevinkteCats();

    let html = "";
    for (const [hgId, groepen] of Object.entries(data)) {
      if (Object.keys(groepen).length === 0) continue;
      const hgLabel = wb.hoofdgroepLabels[hgId] || hgId;
      
      let totaal = 0, aanCount = 0;
      for (const cats of Object.values(groepen)) {
        for (const cat of cats) {
          totaal++;
          if (aangevinkt.has(cat.id)) aanCount++;
        }
      }
      const isOpen = wasOpen.has(hgId) || aanCount > 0;

      html += `
        <details class="wd-hoofdgroep" data-hoofdgroep="${hgId}" ${isOpen ? 'open' : ''}>
          <summary>
            <span class="wd-hg-label">${hgLabel}</span>
            <span class="wd-hg-teller">${aanCount}/${totaal}</span>
          </summary>
          <div class="wd-hg-inhoud">`;
      
      for (const [groepId, cats] of Object.entries(groepen)) {
        const groepLabel = wb.groepLabels[groepId] || groepId;
        html += `<div class="wd-groep">
          <div class="wd-groep-titel">${groepLabel}</div>
          <div class="wd-cat-rij">`;
        for (const cat of cats) {
          const checked = aangevinkt.has(cat.id);
          html += `
            <label class="wd-cat-vink ${checked ? 'aan' : ''}">
              <input type="checkbox" class="wd-cat-checkbox" 
                     data-cat="${cat.id}" ${checked ? 'checked' : ''}>
              <span>${cat.naam}</span>
              <span class="wd-cat-aantal">(${cat.woorden.length})</span>
            </label>`;
        }
        html += `</div></div>`;
      }
      html += `</div></details>`;
    }
    container.innerHTML = html;
    updateWoordenkiezerKnop();
  }

  /* ---------- Update woordenkiezer-knop op basis van keuze ---------- */
  function updateWoordenkiezerKnop() {
    const knop = document.querySelector("#wd-paneel-open-kiezer");
    const info = document.querySelector("#wd-paneel-woord-info");
    const aangevinkt = getAangevinkteCats();

    // Sync de filter-set zodat woordenkiezer + modules dezelfde lijst zien
    window._zb_aangevinkteCategorieen = aangevinkt;
    if (window.SpellingWoordenkiezer && typeof window.SpellingWoordenkiezer.syncActieveWoorden === "function") {
      window.SpellingWoordenkiezer.syncActieveWoorden();
    }

    const aantalActief = (window._weekdictee_gekozenWoorden || []).length;

    if (knop) {
      knop.disabled = aangevinkt.size === 0;
    }
    if (info) {
      if (aangevinkt.size === 0) {
        info.textContent = "Kies eerst minstens één categorie hierboven.";
        info.className = "wd-paneel-info wd-info-grijs";
      } else if (aantalActief === 0) {
        info.textContent = "Klik op de knop om woorden te kiezen.";
        info.className = "wd-paneel-info";
      } else {
        info.innerHTML = `<strong>${aantalActief}</strong> woord${aantalActief === 1 ? '' : 'en'} gekozen ✓`;
        info.className = "wd-paneel-info wd-info-groen";
      }
    }

    // Vernieuwen + downloaden knoppen alleen actief als er woorden zijn
    document.querySelectorAll(".wd-paneel-actie").forEach(b => {
      b.disabled = aantalActief === 0;
    });
  }

  /* ---------- Render lijntype-knoppen status ---------- */
  function updateLijntypeKnoppen() {
    document.querySelectorAll("#wd-paneel-lijntype .lijn-knop").forEach(b => {
      b.classList.toggle("actief", b.dataset.lijn === lijntype);
    });
    document.querySelectorAll("#wd-paneel-lijnhoogte button").forEach(b => {
      b.classList.toggle("actief", b.dataset.hoogte === lijnhoogte);
    });
  }

  /* ---------- Vernieuw preview ---------- */
  function vernieuwPreview() {
    const aantal = (window._weekdictee_gekozenWoorden || []).length;
    if (aantal === 0) {
      const preview = document.querySelector("#wd-paneel-preview");
      if (preview) {
        preview.innerHTML = `
          <div class="preview-leeg">
            <h3>Nog geen weekdictee gegenereerd</h3>
            <p>Kies eerst woorden en klik dan op <strong>Vernieuw voorbeeld</strong>.</p>
          </div>`;
      }
      return;
    }

    const module = window.SpellingModules?.weekdictee;
    if (!module) {
      console.error("Module weekdictee niet beschikbaar");
      return;
    }

    // Bouw opties-object. metZinnen → aantalZinnen: 0 of 1.
    // De module zet zelf aantalWoorden default op 5. Voor het paneel volstaan
    // die defaults; geavanceerde instellingen komen later.
    const opties = {
      categorie: "weekdictee",
      graad: actieveGraad,
      niveau: "basis",
      subcat: "kort",
      lijntypeGlobaal: lijntype,
      lijntypePerVorm: {},
      weekdictee: {
        lijnhoogte: lijnhoogte,
        lijntype: lijntype === "vier" ? "type3" : (lijntype === "dubbel" ? "type2" : "type1"),
        aantalZinnen: metZinnen ? 1 : 0
      }
    };

    let html = "";
    try {
      // De preview toont ALTIJD de dicteerblad-versie (mét woorden + zinnen).
      // Dat is de versie die de juf nodig heeft om aan te passen voor ze
      // gaat dicteren. Het leerling-blad wordt enkel bij de download
      // van "Leerling-blad" zonder antwoorden gegenereerd.
      html = module.genereerBlad(opties, true);
    } catch (e) {
      console.error("Kon weekdictee niet genereren:", e);
      html = `<div class="preview-leeg"><p>Er ging iets mis bij het genereren. Probeer opnieuw.</p></div>`;
    }

    const preview = document.querySelector("#wd-paneel-preview");
    if (!preview) return;
    preview.innerHTML = html;

    // Pas eerder opgeslagen inline-wijzigingen toe op de nieuwe render.
    pasWijzigingenToe(preview);

    // ✕ verwijder-knop op elke woord-rij en zin-rij hangen.
    voegVerwijderKnoppenToe(preview);

    // Bewerk-modus: contenteditable toepassen op alle bewerkbare elementen.
    pasBewerkModusToe(preview);

    // Teken canvases NA DOM-insertion zodat layout-breedte bekend is.
    if (window.SpellingSchrijflijnen) {
      requestAnimationFrame(() => window.SpellingSchrijflijnen.tekenAlle(preview));
    }
  }

  /* ---------- Pas inline-wijzigingen weer toe na rerender ---------- */
  function pasWijzigingenToe(preview) {
    if (!preview) return;
    for (const [id, html] of Object.entries(wijzigingen)) {
      const el = preview.querySelector(`[data-bewerk-id="${id}"]`);
      if (el) el.innerHTML = html;
    }
  }

  /* ---------- Hang ✕ verwijder-knoppen aan elke woord- en zin-rij ---------- */
  function voegVerwijderKnoppenToe(preview) {
    if (!preview) return;
    const rijen = preview.querySelectorAll(".dag-woord-rij[data-woord-tekst], .wd-zin-rij[data-woord-tekst]");
    rijen.forEach(rij => {
      // Voorkom dubbele knoppen bij meerdere rerenders
      if (rij.querySelector(".wd-verwijder-woord")) return;
      const woordTekst = rij.dataset.woordTekst;
      // Voor de tooltip: gebruik de getoonde dictee-vorm als die er is,
      // anders de grondvorm. De leerkracht ziet bv. "de katten" op het blad
      // en zou verward zijn als de tooltip "Verwijder kat" zegt.
      const tonen = rij.dataset.dicteeVorm || woordTekst;
      const knop = document.createElement("button");
      knop.type = "button";
      knop.className = "wd-verwijder-woord";
      knop.title = `Verwijder "${tonen}" uit het dictee`;
      knop.textContent = "✕";
      knop.addEventListener("click", (e) => {
        e.stopPropagation();
        verwijderWoord(woordTekst);
      });
      rij.appendChild(knop);
    });
  }

  /* ---------- Pas bewerk-modus toe op alle bewerkbare elementen ---------- */
  function pasBewerkModusToe(preview) {
    if (!preview) return;
    preview.querySelectorAll("[data-bewerk-id]").forEach(el => {
      if (bewerkAan) el.setAttribute("contenteditable", "true");
      else el.removeAttribute("contenteditable");
    });
    preview.classList.toggle("wd-bewerk-aan", bewerkAan);
  }

  /* ---------- Verwijder een woord uit de gekozenWoorden-pool + rerender ---------- */
  function verwijderWoord(woordTekst) {
    if (!woordTekst) return;
    const wk = window.SpellingWoordenkiezer;
    if (!wk || typeof wk.getGekozen !== "function") return;

    // We krijgen een REFERENTIE naar de interne `gekozen`-array van de
    // woordenkiezer-module (zie woordenkiezer.js getGekozen). Door er
    // in-place uit te splicen synchroniseren we de interne state direct.
    const ruwe = wk.getGekozen();
    for (let i = ruwe.length - 1; i >= 0; i--) {
      if (ruwe[i].tekst === woordTekst) ruwe.splice(i, 1);
    }

    // Schrijf ook naar LS (zelfde key als woordenkiezer gebruikt) zodat het
    // ook na refresh klopt. Dit dupliceert wat de woordenkiezer normaal in
    // bewaar() doet, maar we hebben geen publieke save-functie.
    try {
      localStorage.setItem("spelling-weekdictee-gekozen-v1", JSON.stringify(ruwe));
    } catch (e) {
      console.warn("Kon woordenlijst niet opslaan:", e);
    }

    // Sync de globale "actieve woorden"-pool (gefilterd op aangevinkte cats).
    if (typeof wk.syncActieveWoorden === "function") {
      wk.syncActieveWoorden();
    }

    // Notificeer luisteraars (zijbalk + woordenkiezer-modal updaten teller etc.)
    window.dispatchEvent(new Event("spelling:woorden-gewijzigd"));

    // Vergeet de wijzigingen — woord-id-posities verschuiven.
    wijzigingen = {};

    // Update de info-knop en rerender de preview
    updateWoordenkiezerKnop();
    vernieuwPreview();
  }

  /* ---------- Download PDF ----------
     Strategie (gelijk aan pdf-engine.js, die bewezen werkt):
     1. Render de oplossingen/werkblad in de ZICHTBARE preview (#wd-paneel-preview).
        Dat geeft de browser een echte gerenderde layout met meetbare hoogtes.
     2. Kloon die preview.
     3. Plaats de kloon in een tijdelijke off-screen container (visibility:hidden
        op top:0/left:0 — NIET left:-99999px want dat krijgt soms geen layout-pass).
     4. Teken canvases (schrijflijnen) opnieuw in de kloon.
     5. Roep html2pdf aan met de kloon als bron.
     6. Bij oplossingen: herstel daarna de oorspronkelijke werkblad-preview. */
  function downloadPDF(metOplossingen) {
    if (typeof html2pdf === "undefined") {
      alert("PDF-bibliotheek nog aan het laden. Probeer over een paar seconden opnieuw.");
      return;
    }
    const aantal = (window._weekdictee_gekozenWoorden || []).length;
    if (aantal === 0) {
      alert("Kies eerst woorden voor het weekdictee.");
      return;
    }

    const preview = document.querySelector("#wd-paneel-preview");
    if (!preview) {
      alert("Preview-container niet gevonden.");
      return;
    }

    const downloadKnop = metOplossingen 
      ? document.querySelector("#wd-paneel-download-opl")
      : document.querySelector("#wd-paneel-download");
    const oudeTekst = downloadKnop ? downloadKnop.textContent : "";
    if (downloadKnop) {
      downloadKnop.textContent = "PDF maken…";
      downloadKnop.disabled = true;
    }

    // Render de juiste versie (werkblad of oplossingen) in de zichtbare preview.
    const module = window.SpellingModules?.weekdictee;
    if (!module) {
      if (downloadKnop) { downloadKnop.textContent = oudeTekst; downloadKnop.disabled = false; }
      return;
    }

    const opties = {
      categorie: "weekdictee",
      graad: actieveGraad,
      niveau: "basis",
      subcat: "kort",
      lijntypeGlobaal: lijntype,
      lijntypePerVorm: {},
      weekdictee: {
        lijnhoogte: lijnhoogte,
        lijntype: lijntype === "vier" ? "type3" : (lijntype === "dubbel" ? "type2" : "type1"),
        aantalZinnen: metZinnen ? 1 : 0
      }
    };

    // BELANGRIJK: bij "Dicteerblad (mijn versie)" (metOplossingen=true) tonen we
    // EXACT wat in de preview staat. Niet regenereren — anders worden de zinnen
    // opnieuw geshufeld en zie je iets anders dan in de preview.
    // Bij "Leerling-blad" (metOplossingen=false) regenereren we wel: dat is een
    // andere variant (zonder woorden) en we hebben geen bewerkingen die we 
    // moeten behouden.
    if (!metOplossingen) {
      preview.innerHTML = module.genereerBlad(opties, metOplossingen);
    }
    // Pas inline-wijzigingen toe (alleen relevant bij oplossingen — bij
    // werkblad zonder antwoorden zijn er geen .antwoord-spans om te wijzigen).
    if (metOplossingen) {
      pasWijzigingenToe(preview);
    }
    if (window.SpellingSchrijflijnen) {
      window.SpellingSchrijflijnen.tekenAlle(preview);
    }

    // Wacht 2 frames zodat de browser layout + paint kan voltooien.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {

        // Kloon de zichtbare preview — die heeft nu een echte offsetWidth.
        const kloon = preview.cloneNode(true);
        kloon.classList.remove("preview-modus");
        kloon.classList.remove("wd-toont-woorden");
        kloon.classList.remove("wd-bewerk-aan");
        kloon.removeAttribute("id");

        // Verwijder UI-only elementen uit de kloon (✕ knoppen) zodat ze
        // niet in de PDF terechtkomen.
        kloon.querySelectorAll(".wd-verwijder-woord").forEach(b => b.remove());
        // Verwijder contenteditable-attributen (geen visuele impact maar net).
        kloon.querySelectorAll("[contenteditable]").forEach(el => el.removeAttribute("contenteditable"));

        const tijdelijk = document.createElement("div");
        tijdelijk.style.position = "absolute";
        tijdelijk.style.top = "0";
        tijdelijk.style.left = "0";
        tijdelijk.style.width = preview.offsetWidth + "px";
        tijdelijk.style.zIndex = "999999";
        tijdelijk.style.background = "#fff";
        tijdelijk.style.visibility = "hidden";
        tijdelijk.appendChild(kloon);
        document.body.appendChild(tijdelijk);

        // Teken canvases opnieuw in de kloon (de gekloonde canvases zijn leeg).
        if (window.SpellingSchrijflijnen) {
          window.SpellingSchrijflijnen.tekenAlle(kloon);
        }

        const datum = new Date().toISOString().slice(0, 10);
        const naam = metOplossingen
          ? `weekdictee-dicteerblad-${datum}.pdf`
          : `weekdictee-leerling-${datum}.pdf`;

        const pdfOpties = {
          margin: 0,
          filename: naam,
          image: { type: "jpeg", quality: 0.95 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            letterRendering: true,
            backgroundColor: "#ffffff",
            scrollX: 0,
            scrollY: 0
          },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
          pagebreak: {
            mode: "css",
            before: ".pagina-break-voor",
            avoid: [".werkblad", ".weekdictee-blad", ".dag-blok"]
          }
        };

        const opruimen = () => {
          tijdelijk.remove();
          // Herstel de preview alleen als we hem hebben gewijzigd (bij leerling-blad).
          // Bij dicteerblad (mijn versie) hebben we niet geregenereerd, dus 
          // de preview staat al exact zoals de gebruiker hem wilde behouden.
          if (!metOplossingen) {
            vernieuwPreview();
          }
          if (downloadKnop) {
            downloadKnop.textContent = oudeTekst;
            downloadKnop.disabled = false;
          }
        };

        html2pdf().set(pdfOpties).from(kloon).save()
          .then(opruimen)
          .catch(err => {
            console.error("PDF-fout:", err);
            alert("Er ging iets mis bij het maken van de PDF. Probeer opnieuw.");
            opruimen();
          });

      });
    });
  }

  /* ---------- Event-bedrading (eenmalig) ---------- */
  function bedraadEvents() {
    if (geinitialiseerd) return;
    geinitialiseerd = true;

    // Graad-tabs
    document.querySelectorAll("#wd-paneel-graad-tabs .graad-tab").forEach(tab => {
      tab.addEventListener("click", () => {
        if (tab.disabled) return;
        actieveGraad = parseInt(tab.dataset.graad, 10);
        bewaarState();
        renderGraadTabs();
        renderCategorieKeuze();
        updateWoordenkiezerKnop();
      });
    });

    // Categorie-vinkjes (event-delegatie)
    document.querySelector("#wd-paneel-categorieen")?.addEventListener("change", (e) => {
      if (e.target.matches(".wd-cat-checkbox")) {
        const catId = e.target.dataset.cat;
        const set = getAangevinkteCats();
        if (e.target.checked) set.add(catId);
        else set.delete(catId);
        bewaarState();
        // BELANGRIJK: deel de huidige set met de woordenkiezer + 
        // andere modules zodat zij weten welke categorieën actief zijn.
        // Anders blijven de keuzes van de woordenkiezer uitgevinkt 
        // omdat hij denkt dat er geen categorieën aangevinkt zijn.
        window._zb_aangevinkteCategorieen = set;
        if (window.SpellingWoordenkiezer?.syncActieveWoorden) {
          window.SpellingWoordenkiezer.syncActieveWoorden();
        }
        renderCategorieKeuze();
        // Ook de UI-state bijwerken (knoppen, teller)
        updateWoordenkiezerKnop();
      }
    });

    // Woordenkiezer openen
    document.querySelector("#wd-paneel-open-kiezer")?.addEventListener("click", () => {
      if (window.SpellingWoordenkiezer) {
        window._zb_aangevinkteCategorieen = getAangevinkteCats();
        window.SpellingWoordenkiezer.open();
      }
    });

    // Lijntype-knoppen
    document.querySelectorAll("#wd-paneel-lijntype .lijn-knop").forEach(btn => {
      btn.addEventListener("click", () => {
        lijntype = btn.dataset.lijn;
        bewaarState();
        updateLijntypeKnoppen();
      });
    });

    // Lijnhoogte-knoppen
    document.querySelectorAll("#wd-paneel-lijnhoogte button").forEach(btn => {
      btn.addEventListener("click", () => {
        lijnhoogte = btn.dataset.hoogte;
        bewaarState();
        updateLijntypeKnoppen();
      });
    });

    // Vernieuw / Download / Download oplossingen
    document.querySelector("#wd-paneel-vernieuw")?.addEventListener("click", () => {
      // Bij handmatig "Vernieuw": wis bestaande inline-wijzigingen.
      // De leerkracht wil dan een verse start.
      wijzigingen = {};
      vernieuwPreview();
    });
    document.querySelector("#wd-paneel-download")?.addEventListener("click", () => downloadPDF(false));
    document.querySelector("#wd-paneel-download-opl")?.addEventListener("click", () => downloadPDF(true));

    // "Met zinnen" toggle
    document.querySelector("#wd-paneel-met-zinnen")?.addEventListener("change", (e) => {
      metZinnen = e.target.checked;
      bewaarState();
      // Bij wijziging: wis inline-wijzigingen want layout verandert.
      wijzigingen = {};
      vernieuwPreview();
    });

    // Bewerken-toggle
    document.querySelector("#wd-paneel-bewerken")?.addEventListener("click", () => {
      bewerkAan = !bewerkAan;
      updateBewerkenKnop();
      const preview = document.querySelector("#wd-paneel-preview");
      pasBewerkModusToe(preview);
      // Bij aanzetten: focus op het eerste bewerkbare element zodat de
      // leerkracht meteen kan typen zonder te moeten klikken.
      if (bewerkAan && preview) {
        const eerste = preview.querySelector("[data-bewerk-id]");
        if (eerste) {
          eerste.focus();
          // Plaats cursor aan einde van de tekst
          if (window.getSelection && document.createRange) {
            const range = document.createRange();
            range.selectNodeContents(eerste);
            range.collapse(false);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
          }
        }
      }
    });

    // Inline bewerken: input-events op contenteditable elementen bewaren.
    // Event-delegatie zodat dit ook werkt na rerender.
    document.querySelector("#wd-paneel-preview")?.addEventListener("input", (e) => {
      const el = e.target.closest("[data-bewerk-id]");
      if (el && el.hasAttribute("contenteditable")) {
        wijzigingen[el.dataset.bewerkId] = el.innerHTML;
      }
    });

    // Reageer als de woordenkiezer wijzigingen heeft doorgevoerd —
    // (in werkblad-modus aangevinkt/uitgevinkt, of via ✕ in deze preview)
    window.addEventListener("spelling:woorden-gewijzigd", () => {
      updateWoordenkiezerKnop();
    });

    // Reageer als paneel zichtbaar wordt — herrender state (graad/categorieën
    // kunnen in werkblad-modus gewijzigd zijn)
    window.addEventListener("spelling:weekdictee-actief", () => {
      laadState();
      renderGraadTabs();
      renderCategorieKeuze();
      updateLijntypeKnoppen();
      updateToggleStanden();
      updateWoordenkiezerKnop();
    });
  }

  /* ---------- Update de toggle-checkboxes op basis van state ---------- */
  function updateToggleStanden() {
    const mz = document.querySelector("#wd-paneel-met-zinnen");
    if (mz) mz.checked = metZinnen;
    updateBewerkenKnop();
  }

  function updateBewerkenKnop() {
    const knop = document.querySelector("#wd-paneel-bewerken");
    if (!knop) return;
    knop.textContent = bewerkAan ? "✏️ Bewerken: aan" : "✏️ Bewerken: uit";
    knop.classList.toggle("actief", bewerkAan);
  }

  /* ---------- Init ---------- */
  function init() {
    laadState();
    bedraadEvents();
    renderGraadTabs();
    renderCategorieKeuze();
    updateLijntypeKnoppen();
    updateToggleStanden();
    updateWoordenkiezerKnop();
  }

  return {
    init,
    vernieuwPreview
  };

})();

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => window.SpellingWeekdicteePaneel.init());
} else {
  window.SpellingWeekdicteePaneel.init();
}
/* ==========================================================
   app.js
   Bedraad alle UI events: knoppen, niveau-wissels, etc.
   ========================================================== */

(function() {

  const niveauUitleg = {
    basis: "<strong>Basis:</strong> herkennen en kopiëren met visuele steun.",
    kern: "<strong>Kern:</strong> regel toepassen in losse woorden en zinnen.",
    verdieping: "<strong>Verdieping:</strong> regel toepassen in vrije zinnen en uitzonderingen herkennen."
  };

  /* ----- helper: actieve knop toggelen binnen een groep ----- */
  function maakActief(groepSelector, knop) {
    document.querySelectorAll(groepSelector).forEach(b => b.classList.remove("actief"));
    knop.classList.add("actief");
  }

  /* ----- Modulespecifieke instellingen renderen ----- */
  function laadModuleInstellingen() {
    const cat = document.querySelector(".cat-knop.actief")?.dataset.categorie;
    const module = window.SpellingModules[cat];
    if (!module) return;

    const container = document.querySelector("#module-instellingen");
    container.innerHTML = module.renderInstellingen();

    // Voor weekdictee + ov01-04: andere UI-elementen verbergen
    const isWeekdictee = (cat === "weekdictee");
    const isOV01 = (cat === "ov01");
    const isOV02 = (cat === "ov02");
    const isOV03 = (cat === "ov03");
    const isOV04 = (cat === "ov04");
    const isOV05 = (cat === "ov05");
    const isOV06 = (cat === "ov06");
    const verbergStandaard = isWeekdictee || isOV01 || isOV02 || isOV03 || isOV04 || isOV05 || isOV06;
    document.querySelectorAll(".sidebar .block").forEach(blok => {
      const h2 = blok.querySelector("h2")?.textContent || "";
      if (verbergStandaard && (h2.startsWith("3.") || h2.startsWith("4."))) {
        blok.style.display = "none";
      } else if (!verbergStandaard && (h2.startsWith("3.") || h2.startsWith("4."))) {
        blok.style.display = "";
      }
    });

    // === OV06-specifieke bedrading ===
    if (isOV06) {
      container.querySelector("#ov06-open-kiezer")?.addEventListener("click", () => {
        if (window.SpellingWoordenkiezer) window.SpellingWoordenkiezer.open();
      });
      if (window.SpellingWoordenkiezer) {
        window.SpellingWoordenkiezer.updateSidebarInfo();
        const aantal = (window._weekdictee_gekozenWoorden || []).length;
        const info = document.querySelector("#ov06-keuze-info");
        if (info) {
          if (aantal === 0) {
            info.textContent = "Nog geen woorden gekozen.";
            info.style.color = "#888";
          } else {
            info.innerHTML = `<strong>${aantal}</strong> woord${aantal === 1 ? '' : 'en'} gekozen ✓`;
            info.style.color = "var(--zisa-blauw)";
          }
        }
      }
      container.querySelectorAll("#ov06-niveaus input[type='checkbox']").forEach(cb => {
        cb.addEventListener("change", () => {
          cb.closest(".ov-niveau-vink").classList.toggle("actief", cb.checked);
        });
      });
      container.querySelectorAll("#ov06-lijnhoogte button").forEach(btn => {
        btn.addEventListener("click", () => {
          maakActief("#ov06-lijnhoogte button", btn);
          window.SpellingSchrijflijnen?.tekenLijntypePreviews();
        });
      });
      window.SpellingSchrijflijnen?.tekenLijntypePreviews();
      return;
    }

    // === OV05-specifieke bedrading ===
    if (isOV05) {
      container.querySelector("#ov05-open-kiezer")?.addEventListener("click", () => {
        if (window.SpellingWoordenkiezer) window.SpellingWoordenkiezer.open();
      });
      if (window.SpellingWoordenkiezer) {
        window.SpellingWoordenkiezer.updateSidebarInfo();
        const aantal = (window._weekdictee_gekozenWoorden || []).length;
        const info = document.querySelector("#ov05-keuze-info");
        if (info) {
          if (aantal === 0) {
            info.textContent = "Nog geen woorden gekozen.";
            info.style.color = "#888";
          } else {
            info.innerHTML = `<strong>${aantal}</strong> woord${aantal === 1 ? '' : 'en'} gekozen ✓`;
            info.style.color = "var(--zisa-blauw)";
          }
        }
      }

      container.querySelectorAll("#ov05-niveaus input[type='checkbox']").forEach(cb => {
        cb.addEventListener("change", () => {
          cb.closest(".ov-niveau-vink").classList.toggle("actief", cb.checked);
        });
      });

      container.querySelectorAll("#ov05-lijnhoogte button").forEach(btn => {
        btn.addEventListener("click", () => {
          maakActief("#ov05-lijnhoogte button", btn);
          window.SpellingSchrijflijnen?.tekenLijntypePreviews();
        });
      });

      window.SpellingSchrijflijnen?.tekenLijntypePreviews();
      return;
    }

    // === OV04-specifieke bedrading ===
    if (isOV04) {
      // Open woordenkiezer
      container.querySelector("#ov04-open-kiezer")?.addEventListener("click", () => {
        if (window.SpellingWoordenkiezer) window.SpellingWoordenkiezer.open();
      });
      if (window.SpellingWoordenkiezer) {
        window.SpellingWoordenkiezer.updateSidebarInfo();
        const aantal = (window._weekdictee_gekozenWoorden || []).length;
        const info = document.querySelector("#ov04-keuze-info");
        if (info) {
          if (aantal === 0) {
            info.textContent = "Nog geen woorden gekozen.";
            info.style.color = "#888";
          } else {
            info.innerHTML = `<strong>${aantal}</strong> woord${aantal === 1 ? '' : 'en'} gekozen ✓`;
            info.style.color = "var(--zisa-blauw)";
          }
        }
      }

      // Niveau-vinkjes
      container.querySelectorAll("#ov04-niveaus input[type='checkbox']").forEach(cb => {
        cb.addEventListener("change", () => {
          cb.closest(".ov-niveau-vink").classList.toggle("actief", cb.checked);
        });
      });

      // Aantal kolommen knoppen — verberg/toon kolom 3
      container.querySelectorAll("#ov04-aantal-kolommen button").forEach(btn => {
        btn.addEventListener("click", () => {
          maakActief("#ov04-aantal-kolommen button", btn);
          const aantal = parseInt(btn.dataset.aantal, 10);
          const kolom3 = container.querySelector('.ov04-kolom-rij[data-kolom="3"]');
          if (kolom3) {
            kolom3.style.display = aantal === 3 ? "" : "none";
          }
        });
      });
      // Default: 3 kolommen, dus kolom 3 zichtbaar (niets te doen)

      // Klank-dropdown verandert → titel automatisch updaten
      container.querySelectorAll("select.ov04-klank").forEach(select => {
        // Stel default klank-keuze in op basis van standaard-titel
        const defaultTitel = select.dataset.defaultTitel;
        const kh = window.SpellingKlank;
        if (kh) {
          const defaultKlank = Object.keys(kh.STANDAARD_TITELS).find(k => kh.STANDAARD_TITELS[k] === defaultTitel);
          if (defaultKlank) select.value = defaultKlank;
        }

        // Bij wijzigen: titel-veld updaten
        select.addEventListener("change", () => {
          const kolomNr = select.id.replace("ov04-klank-", "");
          const titelVeld = container.querySelector(`#ov04-titel-${kolomNr}`);
          if (titelVeld && window.SpellingKlank) {
            titelVeld.value = window.SpellingKlank.STANDAARD_TITELS[select.value] || "";
          }
        });
      });

      // Lijnhoogte
      container.querySelectorAll("#ov04-lijnhoogte button").forEach(btn => {
        btn.addEventListener("click", () => {
          maakActief("#ov04-lijnhoogte button", btn);
          window.SpellingSchrijflijnen?.tekenLijntypePreviews();
        });
      });

      window.SpellingSchrijflijnen?.tekenLijntypePreviews();
      return;
    }

    // === OV03-specifieke bedrading ===
    if (isOV03) {
      // Open woordenkiezer
      container.querySelector("#ov03-open-kiezer")?.addEventListener("click", () => {
        if (window.SpellingWoordenkiezer) window.SpellingWoordenkiezer.open();
      });
      if (window.SpellingWoordenkiezer) {
        window.SpellingWoordenkiezer.updateSidebarInfo();
        const aantal = (window._weekdictee_gekozenWoorden || []).length;
        const info = document.querySelector("#ov03-keuze-info");
        if (info) {
          if (aantal === 0) {
            info.textContent = "Nog geen woorden gekozen.";
            info.style.color = "#888";
          } else {
            info.innerHTML = `<strong>${aantal}</strong> woord${aantal === 1 ? '' : 'en'} gekozen ✓`;
            info.style.color = "var(--zisa-blauw)";
          }
        }
      }

      // Niveau-vinkjes (basis/kern/verdieping)
      container.querySelectorAll("#ov03-niveaus input[type='checkbox']").forEach(cb => {
        cb.addEventListener("change", () => {
          cb.closest(".ov-niveau-vink").classList.toggle("actief", cb.checked);
        });
      });

      // Lijnhoogte-knoppen
      container.querySelectorAll("#ov03-lijnhoogte button").forEach(btn => {
        btn.addEventListener("click", () => {
          maakActief("#ov03-lijnhoogte button", btn);
          window.SpellingSchrijflijnen?.tekenLijntypePreviews();
        });
      });

      // Teken mini-voorbeelden
      window.SpellingSchrijflijnen?.tekenLijntypePreviews();
      return;
    }

    // === Categorie-specifieke bedrading ===
    if (isOV02) {
      // Open woordenkiezer
      container.querySelector("#ov02-open-kiezer")?.addEventListener("click", () => {
        if (window.SpellingWoordenkiezer) window.SpellingWoordenkiezer.open();
      });
      if (window.SpellingWoordenkiezer) {
        window.SpellingWoordenkiezer.updateSidebarInfo();
        const aantal = (window._weekdictee_gekozenWoorden || []).length;
        const info = document.querySelector("#ov02-keuze-info");
        if (info) {
          if (aantal === 0) {
            info.textContent = "Nog geen woorden gekozen.";
            info.style.color = "#888";
          } else {
            info.innerHTML = `<strong>${aantal}</strong> woord${aantal === 1 ? '' : 'en'} gekozen ✓`;
            info.style.color = "var(--zisa-blauw)";
          }
        }
      }

      // Lijnhoogte-knoppen
      container.querySelectorAll("#ov02-lijnhoogte button").forEach(btn => {
        btn.addEventListener("click", () => {
          maakActief("#ov02-lijnhoogte button", btn);
          window.SpellingSchrijflijnen?.tekenLijntypePreviews();
        });
      });

      // Teken mini-voorbeelden bij de schrijflijntype-knoppen
      window.SpellingSchrijflijnen?.tekenLijntypePreviews();

      return;
    }

    // === Categorie-specifieke bedrading ===
    if (isOV01) {
      // Open woordenkiezer
      container.querySelector("#ov01-open-kiezer")?.addEventListener("click", () => {
        if (window.SpellingWoordenkiezer) window.SpellingWoordenkiezer.open();
      });
      if (window.SpellingWoordenkiezer) {
        window.SpellingWoordenkiezer.updateSidebarInfo();
        const aantal = (window._weekdictee_gekozenWoorden || []).length;
        const info = document.querySelector("#ov01-keuze-info");
        if (info) {
          if (aantal === 0) {
            info.textContent = "Nog geen woorden gekozen.";
            info.style.color = "#888";
          } else {
            info.innerHTML = `<strong>${aantal}</strong> woord${aantal === 1 ? '' : 'en'} gekozen ✓`;
            info.style.color = "var(--zisa-blauw)";
          }
        }
      }

      // Niveau-vinkjes (basis/kern/verdieping)
      container.querySelectorAll("#ov01-niveaus input[type='checkbox']").forEach(cb => {
        cb.addEventListener("change", () => {
          cb.closest(".ov-niveau-vink").classList.toggle("actief", cb.checked);
        });
      });

      // Lijnhoogte-knoppen
      container.querySelectorAll("#ov01-lijnhoogte button").forEach(btn => {
        btn.addEventListener("click", () => {
          maakActief("#ov01-lijnhoogte button", btn);
          // Hertekén schrijflijn-previews bij hoogtewissel
          window.SpellingSchrijflijnen?.tekenLijntypePreviews();
        });
      });

      // Teken de mini-voorbeelden bij de schrijflijntype-knoppen
      window.SpellingSchrijflijnen?.tekenLijntypePreviews();

      return;
    }

    if (isWeekdictee) {
      // Open-knop voor woordenkiezer
      container.querySelector("#wd-open-kiezer")?.addEventListener("click", () => {
        if (window.SpellingWoordenkiezer) window.SpellingWoordenkiezer.open();
      });

      // Update sidebar-info met huidige keuze
      if (window.SpellingWoordenkiezer) window.SpellingWoordenkiezer.updateSidebarInfo();

      // Lijnhoogte-knoppen (middel/klein)
      container.querySelectorAll("#wd-lijnhoogte button").forEach(btn => {
        btn.addEventListener("click", () => {
          maakActief("#wd-lijnhoogte button", btn);
          window.SpellingSchrijflijnen?.tekenLijntypePreviews();
        });
      });

      // Teken de mini-voorbeelden bij de schrijflijntype-knoppen
      window.SpellingSchrijflijnen?.tekenLijntypePreviews();

      // EIGEN VERNIEUW + DOWNLOAD voor weekdictee
      container.querySelector("#wd-vernieuw")?.addEventListener("click", () => {
        // Render direct in preview (vervangt bundel-inhoud tijdelijk)
        const opties = window.SpellingGenerator?.leesOpties();
        if (!opties) return;
        const html = window.SpellingGenerator.genereerBundel(opties);
        const preview = document.querySelector("#preview");
        if (preview) {
          preview.innerHTML = html;
          if (window.SpellingSchrijflijnen) {
            requestAnimationFrame(() => window.SpellingSchrijflijnen.tekenAlle(preview));
          }
        }
      });

      container.querySelector("#wd-download")?.addEventListener("click", () => {
        if (window.SpellingPDF) window.SpellingPDF.download(false);
      });

      container.querySelector("#wd-download-opl")?.addEventListener("click", () => {
        if (window.SpellingPDF) window.SpellingPDF.download(true);
      });

      return;
    }

    // Subcategorie-knoppen (kort vs tweeklank vs verwar)
    container.querySelectorAll("#subcat-knoppen button").forEach(btn => {
      btn.addEventListener("click", () => {
        maakActief("#subcat-knoppen button", btn);
        toonJuisteBlok();
        vulOefenvormen();
      });
    });

    // Subtype (structuur)-knoppen bedraden
    container.querySelectorAll("#structuur-knoppen button:not([disabled])").forEach(btn => {
      btn.addEventListener("click", () => {
        maakActief("#structuur-knoppen button", btn);
      });
    });

    // Verwar-paar knoppen bedraden
    container.querySelectorAll("#verwar-knoppen button").forEach(btn => {
      btn.addEventListener("click", () => {
        maakActief("#verwar-knoppen button", btn);
      });
    });

    // Oef-tabs bedraden (Basis / Kern / Verdieping)
    container.querySelectorAll(".oef-tab").forEach(btn => {
      btn.addEventListener("click", () => {
        maakActief(".oef-tab", btn);
        actieveOefTab = btn.dataset.niveauTab;
        vulOefenvormen();
      });
    });

    // Reset-knop voor oefenvorm-keuzes
    const resetBtn = container.querySelector("#oef-reset-btn");
    if (resetBtn) {
      resetBtn.addEventListener("click", resetOefenvormen);
    }

    // Eerste keer juist blok tonen
    toonJuisteBlok();

    // Oefenvormen vullen op basis van huidig niveau
    vulOefenvormen();
  }

  /* ----- Toon kort-blok, tweeklank-blok of verwar-blok (alleen klankzuiver) ----- */
  function toonJuisteBlok() {
    const cat = document.querySelector(".cat-knop.actief")?.dataset.categorie;
    if (cat !== "klankzuiver") return; // weekdictee heeft deze blokken niet
    const subcat = document.querySelector("#subcat-knoppen button.actief")?.dataset.subcat;
    const kortBlok = document.querySelector("#kort-blok");
    const twBlok = document.querySelector("#tweeklank-blok");
    const verwBlok = document.querySelector("#verwar-blok");
    if (!kortBlok || !twBlok || !verwBlok) return;
    kortBlok.style.display = (subcat === "kort") ? "" : "none";
    twBlok.style.display   = (subcat === "tweeklank") ? "" : "none";
    verwBlok.style.display = (subcat === "verwar") ? "" : "none";
  }

  /* ----- Geheugen voor oefenvorm-keuzes -----
     Map: oefenvorm-id → { aangevinkt: bool, lijntype: "" | "vier" | "dubbel" | "enkel" }
     Als een id NIET in deze map staat, gebruiken we de default uit de module.
     Wordt geëxposeerd via window zodat generator.js erbij kan. */
  let oefKeuzes = {};
  window._SpellingOefKeuzes = () => oefKeuzes;

  /* Welke tab in de oefenvorm-sectie actief is */
  let actieveOefTab = "basis";

  /* ----- Reset: vergeet alle keuzes, zet alles terug naar defaults ----- */
  function resetOefenvormen() {
    oefKeuzes = {};
    vulOefenvormen();
  }

  /* ----- Verzamel alle oefenvormen die uniek voorkomen over alle niveaus
     en die geldig zijn voor de huidige subcat ----- */
  function alleOefenvormenVoorSubcat(module, subcat) {
    const gezien = new Set();
    const result = {};
    for (const niveau of ["basis", "kern", "verdieping"]) {
      const lijst = (module.oefenvormenPerNiveau[niveau] || [])
        .filter(o => !o.alleenVoor || o.alleenVoor === subcat);
      result[niveau] = lijst;
      lijst.forEach(o => gezien.add(o.id));
    }
    return { perNiveau: result, alleIds: [...gezien] };
  }

  /* ----- Vul oefenvormenlijst op basis van actieve tab + subcat ----- */
  function vulOefenvormen() {
    const cat = document.querySelector(".cat-knop.actief")?.dataset.categorie;
    const subcat = document.querySelector("#subcat-knoppen button.actief")?.dataset.subcat;
    const module = window.SpellingModules[cat];
    if (!module) return;

    const { perNiveau, alleIds } = alleOefenvormenVoorSubcat(module, subcat);

    // Initialiseer geheugen voor nieuwe ids met defaults uit elke niveau-lijst
    alleIds.forEach(id => {
      if (oefKeuzes[id] === undefined) {
        // Zoek de eerste niveau-versie van deze oefenvorm voor de default-waarde
        let standaard = false;
        for (const niveau of ["basis", "kern", "verdieping"]) {
          const item = perNiveau[niveau].find(o => o.id === id);
          if (item) { standaard = !!item.default; break; }
        }
        oefKeuzes[id] = { aangevinkt: standaard, lijntype: "" };
      }
    });

    // Render alleen oefenvormen voor de actieve tab
    const lijst = perNiveau[actieveOefTab] || [];
    const container = document.querySelector("#oefenvorm-keuze");
    if (!container) return;

    if (lijst.length === 0) {
      container.innerHTML = `<p style="font-size:0.85rem; color:#888; padding: 8px 0">Geen oefenvormen voor dit niveau bij deze categorie.</p>`;
      return;
    }

    container.innerHTML = lijst.map(o => {
      const keuze = oefKeuzes[o.id] || { aangevinkt: false, lijntype: "" };
      const checked = keuze.aangevinkt ? "checked" : "";
      const sel = (val) => keuze.lijntype === val ? "selected" : "";
      return `
      <div class="oefenvorm-rij" title="${o.uitleg || ''}">
        <label class="oefenvorm-label">
          <input type="checkbox" value="${o.id}" ${checked}>
          <span class="oef-icoon">${o.icoon || "•"}</span>
          <span class="oef-naam">${o.label}</span>
        </label>
        <select data-vorm="${o.id}" title="Schrijflijn voor deze oefenvorm">
          <option value="" ${sel("")}>(globaal)</option>
          <option value="vier" ${sel("vier")}>Vierlijn</option>
          <option value="dubbel" ${sel("dubbel")}>Dubbel</option>
          <option value="enkel" ${sel("enkel")}>Enkel</option>
        </select>
      </div>
      <div class="oef-uitleg">${o.uitleg || ""}</div>
    `;
    }).join("");

    // Bedraad checkboxes en selects om geheugen bij te werken
    container.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.addEventListener("change", () => {
        if (!oefKeuzes[cb.value]) oefKeuzes[cb.value] = { aangevinkt: false, lijntype: "" };
        oefKeuzes[cb.value].aangevinkt = cb.checked;
      });
    });
    container.querySelectorAll('select[data-vorm]').forEach(sl => {
      sl.addEventListener("change", () => {
        if (!oefKeuzes[sl.dataset.vorm]) oefKeuzes[sl.dataset.vorm] = { aangevinkt: false, lijntype: "" };
        oefKeuzes[sl.dataset.vorm].lijntype = sl.value;
      });
    });
  }

  /* ----- Niveau-uitleg updaten ----- */
  function updateNiveauUitleg() {
    const niveau = document.querySelector(".niveau-knop.actief")?.dataset.niveau;
    document.querySelector("#niveau-uitleg").innerHTML = niveauUitleg[niveau] || "";
  }

  /* ----- Init bij laden ----- */
  document.addEventListener("DOMContentLoaded", () => {

    // Categorie
    document.querySelectorAll(".cat-knop:not([disabled])").forEach(btn => {
      btn.addEventListener("click", () => {
        maakActief(".cat-knop", btn);
        laadModuleInstellingen();
      });
    });

    // Graad — bij wisselen woordenkiezer-render herhalen indien open
    document.querySelectorAll(".graad-knop:not([disabled])").forEach(btn => {
      btn.addEventListener("click", () => {
        maakActief(".graad-knop", btn);
        // Als de modal openstaat, herrender
        const modal = document.querySelector("#wk-modal");
        if (modal && modal.style.display === "flex" && window.SpellingWoordenkiezer) {
          // Forceer herrender via open() (laadt LS opnieuw + tekent)
          window.SpellingWoordenkiezer.open();
        }
      });
    });

    // Niveau (sidebar 3.): pedagogisch niveau van het werkblad.
    // Bij wisselen synchroniseren we ook de oef-tab — dat scheelt klikken.
    document.querySelectorAll(".niveau-knop").forEach(btn => {
      btn.addEventListener("click", () => {
        maakActief(".niveau-knop", btn);
        updateNiveauUitleg();
        // Synchroniseer de oef-tab met dit niveau
        const niveau = btn.dataset.niveau;
        actieveOefTab = niveau;
        const tab = document.querySelector(`.oef-tab[data-niveau-tab="${niveau}"]`);
        if (tab) maakActief(".oef-tab", tab);
        vulOefenvormen();
      });
    });

    // Lijntype (globaal)
    document.querySelectorAll(".lijn-knop").forEach(btn => {
      btn.addEventListener("click", () => {
        maakActief(".lijn-knop", btn);
      });
    });

    // ----- Bewerken toggle -----
    const bewerkBtn = document.querySelector("#bewerken-toggle");
    bewerkBtn.addEventListener("click", () => {
      const aan = !document.body.classList.contains("bewerk-aan");
      document.body.classList.toggle("bewerk-aan", aan);
      bewerkBtn.classList.toggle("actief", aan);
      bewerkBtn.textContent = aan ? "✏️ Bewerken: aan" : "✏️ Bewerken: uit";
      // Maak alle bewerk-elementen contenteditable
      document.querySelectorAll("#preview [data-bewerk-id]").forEach(el => {
        if (aan) el.setAttribute("contenteditable", "true");
        else el.removeAttribute("contenteditable");
      });
    });

    // ----- Vernieuw voorbeeld (met behoud van bewerkingen voor titel + instructies) -----
    // Strategie: vóór regeneratie, vergelijk huidige tekst met de "originele" tekst die
    // de generator eerder produceerde. Als de gebruiker de tekst heeft aangepast,
    // bewaren we ze. Anders niet (dan willen we de nieuwe gegenereerde tekst).
    let originelePreview = {};  // { bewerk-id: originele HTML }

    function snapshotOriginelen() {
      originelePreview = {};
      document.querySelectorAll("#preview [data-bewerk-id]").forEach(el => {
        originelePreview[el.dataset.bewerkId] = el.innerHTML;
      });
    }

    function verzamelGebruikersBewerkingen() {
      const aanpassingen = {};
      document.querySelectorAll("#preview [data-bewerk-id]").forEach(el => {
        const id = el.dataset.bewerkId;
        const huidig = el.innerHTML;
        if (originelePreview[id] !== undefined && huidig !== originelePreview[id]) {
          aanpassingen[id] = huidig;
        }
      });
      return aanpassingen;
    }

    function pasAanpassingenToe(aanpassingen) {
      Object.entries(aanpassingen).forEach(([id, html]) => {
        const el = document.querySelector(`#preview [data-bewerk-id='${id}']`);
        if (el) el.innerHTML = html;
      });
    }

    // Bewerken-toggle blijft werken zoals voorheen (op huidige preview)

    // Eerste keer: laad module-instellingen + initialiseer bundel preview
    laadModuleInstellingen();
    updateNiveauUitleg();
    
    // Bundel start leeg → toont welkomstboodschap
    if (window.SpellingBundel) {
      window.SpellingBundel._renderPreview();
    }
  });

})();

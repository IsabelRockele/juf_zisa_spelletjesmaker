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
  
  /* Injecteer stijl-regels die de niveau-pillen uitklappen zodat de 
     pedagogische uitleg in <small> zichtbaar is. Idempotent — doet niets 
     als de stijl al ge-injecteerd is. Werkt voor zowel:
     - OV-module's eigen render (.ov-niveau-vink-tekst small)
     - zijbalk's render (.zb-niveau-vink + .zb-niveau-uitleg) */
  function zorgVoorNiveauPilStijlen() {
    if (document.getElementById("niveau-pil-uitleg-stijlen")) return;
    const stijl = document.createElement("style");
    stijl.id = "niveau-pil-uitleg-stijlen";
    stijl.textContent = `
      /* === OV-module render (.ov-niveau-vink) === */
      .ov-niveau-vink {
        align-items: flex-start;
        padding: 8px 12px;
        min-height: auto;
      }
      .ov-niveau-vink-tekst {
        display: flex;
        flex-direction: column;
        gap: 3px;
        flex: 1;
      }
      .ov-niveau-vink-tekst strong {
        display: block;
        font-size: 14px;
        line-height: 1.2;
      }
      .ov-niveau-vink-tekst small {
        display: block;
        font-size: 11.5px;
        line-height: 1.35;
        color: #666;
        font-weight: normal;
        font-style: normal;
        margin-top: 2px;
      }
      .ov-niveau-vink.actief .ov-niveau-vink-tekst small {
        color: #4a4a4a;
      }
      
      /* === Zijbalk render (.zb-niveau-vink) === */
      .zb-niveau-rij {
        margin-bottom: 8px;
      }
      .zb-niveau-vink {
        align-items: flex-start !important;
        padding: 8px 12px !important;
        border-radius: 18px;
        gap: 8px;
      }
      .zb-niveau-tekst {
        display: flex;
        flex-direction: column;
        gap: 3px;
        flex: 1;
        min-width: 0;
      }
      .zb-niveau-label {
        display: block;
        font-size: 13.5px;
        font-weight: 600;
        line-height: 1.2;
      }
      .zb-niveau-uitleg {
        display: block;
        font-size: 11px;
        line-height: 1.35;
        color: #666;
        font-weight: normal;
        margin-top: 2px;
      }
      .zb-niveau-vink.aan .zb-niveau-uitleg {
        color: #4a4a4a;
      }
    `;
    document.head.appendChild(stijl);
  }

  /* ----- Modulespecifieke instellingen renderen ----- */
  function laadModuleInstellingen() {
    const cat = document.querySelector(".cat-knop.actief")?.dataset.categorie;
    const module = window.SpellingModules[cat];
    if (!module) return;

    const container = document.querySelector("#module-instellingen");
    container.innerHTML = module.renderInstellingen();
    
    // Zorg dat de pedagogische uitlegjes in de niveau-pillen zichtbaar zijn
    zorgVoorNiveauPilStijlen();

    // Voor weekdictee + ov01-04: andere UI-elementen verbergen
    const isWeekdictee = (cat === "weekdictee");
    const isOV01 = (cat === "ov01");
    const isOV02 = (cat === "ov02");
    const isOV03 = (cat === "ov03");
    const isOV04 = (cat === "ov04");
    const isOV05 = (cat === "ov05");
    const isOV06 = (cat === "ov06");
    const isOV07 = (cat === "ov07");
    const verbergStandaard = isWeekdictee || isOV01 || isOV02 || isOV03 || isOV04 || isOV05 || isOV06 || isOV07;
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

    // === OV07-specifieke bedrading ===
    if (isOV07) {
      container.querySelector("#ov07-open-kiezer")?.addEventListener("click", () => {
        if (window.SpellingWoordenkiezer) window.SpellingWoordenkiezer.open();
      });
      if (window.SpellingWoordenkiezer) {
        window.SpellingWoordenkiezer.updateSidebarInfo();
        const aantal = (window._weekdictee_gekozenWoorden || []).length;
        const info = document.querySelector("#ov07-keuze-info");
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
      container.querySelectorAll("#ov07-niveaus input[type='checkbox']").forEach(cb => {
        cb.addEventListener("change", () => {
          cb.closest(".ov-niveau-vink").classList.toggle("actief", cb.checked);
        });
      });
      container.querySelectorAll("#ov07-uitgangen input[type='checkbox']").forEach(cb => {
        cb.addEventListener("change", () => {
          cb.closest(".ov-niveau-vink").classList.toggle("actief", cb.checked);
        });
      });
      container.querySelectorAll("#ov07-lijnhoogte button").forEach(btn => {
        btn.addEventListener("click", () => {
          maakActief("#ov07-lijnhoogte button", btn);
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

      // Kleurpickers voor korte / lange / andere klank
      const kleurMap = {
        "ov04-kleur-kort": "kort",
        "ov04-kleur-lang": "lang",
        "ov04-kleur-ander": "ander"
      };
      Object.entries(kleurMap).forEach(([id, sleutel]) => {
        const input = container.querySelector("#" + id);
        if (!input) return;
        input.addEventListener("input", () => {
          if (window.SpellingModules?.ov04?.setKleuren) {
            window.SpellingModules.ov04.setKleuren({ [sleutel]: input.value });
          }
        });
      });
      
      // Reset-knop voor kleuren
      const resetKnop = container.querySelector("#ov04-kleur-reset");
      if (resetKnop) {
        resetKnop.addEventListener("click", () => {
          const ov4 = window.SpellingModules?.ov04;
          if (!ov4) return;
          const def = ov4._DEFAULT_KLEUREN;
          // Reset velden
          const k = container.querySelector("#ov04-kleur-kort");
          const l = container.querySelector("#ov04-kleur-lang");
          const a = container.querySelector("#ov04-kleur-ander");
          if (k) k.value = def.kort;
          if (l) l.value = def.lang;
          if (a) a.value = def.ander;
          ov4.setKleuren({ ...def });
        });
      }

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
      
      // Plaatje-checkbox: bij wijzigen preview verversen + zijbalk-state bijwerken
      container.querySelector("#ov02-met-plaatje")?.addEventListener("change", (e) => {
        // Synchroniseer met zijbalk-state (zodat herhalingsbundel-modus dezelfde keuze ziet)
        const zb = window.SpellingZijbalk;
        if (zb && zb.getOefenvormState) {
          const s = zb.getOefenvormState("ov02");
          // setter ontbreekt — we vinden state via DOM-checkbox in zijbalk
          const zbCheckbox = document.querySelector(".zb-ov02-met-plaatje");
          if (zbCheckbox) {
            zbCheckbox.checked = e.target.checked;
            zbCheckbox.dispatchEvent(new Event("change", { bubbles: true }));
          }
        }
        // Vernieuw preview
        if (window.SpellingPreview?.ververs) window.SpellingPreview.ververs();
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
    const el = document.querySelector("#niveau-uitleg");
    if (el) el.innerHTML = niveauUitleg[niveau] || "";
  }

  /* ----- Init bij laden ----- */
  document.addEventListener("DOMContentLoaded", () => {

    // Injecteer stijlen voor niveau-pil-uitleg meteen bij init
    // (werkt voor zowel werkblad-modus, herhalingsbundel-modus als 
    // de OV-modules' eigen render)
    zorgVoorNiveauPilStijlen();

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

    // === Globale schrijflijn-type (type1-type7, sectie 4) ===
    // De 7 knoppen met canvas-previews. LocalStorage onthoudt de keuze
    // tussen sessies. Klik → actief-class wisselen, opslaan, preview vernieuwen.
    const LS_LIJNTYPE = "spelling-globaal-lijntype-v1";
    const LS_LIJNHOOGTE = "spelling-globaal-lijnhoogte-v1";
    const STORAGE = () => window.SpellingModusStorage || localStorage;

    // Migratie: bij eerste laad, neem oude per-OV lijnhoogte uit oefenvormState
    // als nieuwe globale waarde (als die nog niet expliciet is gezet).
    try {
      if (!STORAGE().getItem(LS_LIJNHOOGTE)) {
        const oudeState = STORAGE().getItem("spelling-zb-oefenvormen-v1");
        if (oudeState) {
          const arr = JSON.parse(oudeState);
          const counts = { klein: 0, middel: 0 };
          for (const s of arr) {
            if (s.lijnhoogte === "klein") counts.klein++;
            else if (s.lijnhoogte === "middel") counts.middel++;
          }
          const meest = counts.klein > counts.middel ? "klein" : "middel";
          STORAGE().setItem(LS_LIJNHOOGTE, meest);
        }
      }
    } catch (e) { /* private mode */ }

    // Laad opgeslagen lijntype + hoogte uit LS en pas actief-class toe
    function _syncLijntypeUI() {
      try {
        const lt = STORAGE().getItem(LS_LIJNTYPE) || "type3";
        document.querySelectorAll("#zb-lt-grid .zb-lt-knop").forEach(b => {
          b.classList.toggle("actief", b.dataset.lt === lt);
        });
        const lh = STORAGE().getItem(LS_LIJNHOOGTE) || "middel";
        document.querySelectorAll("#zb-globale-hoogte .zb-hoogte-btn").forEach(b => {
          b.classList.toggle("actief", b.dataset.hoogte === lh);
        });
      } catch (e) { /* private mode */ }
    }
    _syncLijntypeUI();
    // Maak globaal beschikbaar voor herhaling-init
    window._syncLijntypeUI = _syncLijntypeUI;

    // Click-handler voor type-knoppen
    document.querySelectorAll("#zb-lt-grid .zb-lt-knop").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll("#zb-lt-grid .zb-lt-knop").forEach(b => b.classList.remove("actief"));
        btn.classList.add("actief");
        try { STORAGE().setItem(LS_LIJNTYPE, btn.dataset.lt); } catch (e) {}
        // Vernieuw preview zodat de leerkracht het effect ziet
        if (window.SpellingPreview && typeof window.SpellingPreview.ververs === "function") {
          window.SpellingPreview.ververs();
        }
        // Ook herhalingsbundel-preview verversen
        if (window.SpellingHerhalingsbundel?.renderPreview) {
          window.SpellingHerhalingsbundel.renderPreview();
        }
      });
    });

    // Click-handler voor hoogte-knoppen
    document.querySelectorAll("#zb-globale-hoogte .zb-hoogte-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll("#zb-globale-hoogte .zb-hoogte-btn").forEach(b => b.classList.remove("actief"));
        btn.classList.add("actief");
        try { STORAGE().setItem(LS_LIJNHOOGTE, btn.dataset.hoogte); } catch (e) {}
        if (window.SpellingPreview && typeof window.SpellingPreview.ververs === "function") {
          window.SpellingPreview.ververs();
        }
        if (window.SpellingHerhalingsbundel?.renderPreview) {
          window.SpellingHerhalingsbundel.renderPreview();
        }
      });
    });

    // === Legacy lijn-knop (vier/dubbel/enkel) blijft bestaan in verborgen
    //     div #legacy-lijn-knoppen voor backward-compat, maar heeft geen
    //     event-handler meer nodig. ===

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
    
    // Teken de canvas-previews in de globale schrijflijn-keuze (sectie 4)
    // zodat de leerkracht in de knoppen ziet hoe elk type eruit ziet.
    // tekenLijntypePreviews() zoekt naar canvas.lijntype-preview[data-preview-type]
    // — die class staat op alle 7 knoppen.
    if (window.SpellingSchrijflijnen) {
      requestAnimationFrame(() => {
        window.SpellingSchrijflijnen.tekenLijntypePreviews();
      });
      // Bij open/sluiten van sectie 4 opnieuw tekenen (canvas heeft layout-breedte nodig)
      const sectie4 = document.querySelector("#zb-sec-schrijflijn");
      if (sectie4) {
        sectie4.addEventListener("toggle", () => {
          if (sectie4.open) {
            requestAnimationFrame(() => window.SpellingSchrijflijnen.tekenLijntypePreviews());
          }
        });
      }
    }
    
    // Bundel start leeg → toont welkomstboodschap
    if (window.SpellingBundel) {
      window.SpellingBundel._renderPreview();
    }
    
    /* ============================================================
       HERHALINGSBUNDEL-MODUS
       ============================================================ */
    
    // Bij switchen naar herhalings-modus: verplaats de zijbalk-secties
    // van #modus-werkblad naar #modus-herhaling, init herhalingsbundel.
    let zijbalkVerplaatst = false;
    
    function verplaatsZijbalkNaarHerhaling() {
      const bron = document.querySelector("#modus-werkblad .sidebar");
      const doel = document.querySelector("#hb-sidebar-content");
      if (!bron || !doel) return;
      
      // Verplaats alle kinderen BEHALVE .actie-knoppen (die hoort bij
      // werkblad-modus en heeft een eigen 'Voeg toe aan bundel' knop)
      // en #module-instellingen.
      const teVerplaatsen = [];
      for (const kind of bron.children) {
        if (kind.classList.contains("actie-knoppen")) continue;
        if (kind.id === "module-instellingen") continue;
        teVerplaatsen.push(kind);
      }
      teVerplaatsen.forEach(el => doel.appendChild(el));
      zijbalkVerplaatst = true;
    }
    
    function verplaatsZijbalkTerug() {
      const bron = document.querySelector("#hb-sidebar-content");
      const doel = document.querySelector("#modus-werkblad .sidebar");
      if (!bron || !doel || !zijbalkVerplaatst) return;
      
      // Eerste plaats voor .actie-knoppen vinden zodat we ervoor invoegen
      const actieKnoppen = doel.querySelector(".actie-knoppen");
      const teVerplaatsen = [...bron.children];
      teVerplaatsen.forEach(el => {
        if (actieKnoppen) {
          doel.insertBefore(el, actieKnoppen);
        } else {
          doel.appendChild(el);
        }
      });
      zijbalkVerplaatst = false;
    }
    
    window.addEventListener("spelling:herhaling-actief", () => {
      verplaatsZijbalkNaarHerhaling();
      
      // Belangrijk: herlaad zijbalk + woordenkiezer onder herhalings-namespace
      // (body-class is nu modus-actief-herhaling, dus SpellingModusStorage geeft
      // herhaling-data)
      if (window.SpellingZijbalk?.herlaad) {
        window.SpellingZijbalk.herlaad();
      }
      if (window.SpellingWoordenkiezer?.herlaad) {
        window.SpellingWoordenkiezer.herlaad();
      }
      
      // Lijntype/lijnhoogte UI updaten voor nieuwe modus
      if (window._syncLijntypeUI) window._syncLijntypeUI();
      
      // Init bundel
      if (window.SpellingHerhalingsbundel) {
        window.SpellingHerhalingsbundel.init();
      }
      
      // Sync titel-input
      const titelInput = document.querySelector("#hb-boekje-titel");
      if (titelInput && window.SpellingHerhalingsbundel) {
        try {
          const storage = window.SpellingModusStorage || localStorage;
          const raw = storage.getItem("spelling-herhalingsbundel-v1");
          if (raw) {
            const obj = JSON.parse(raw);
            if (obj.titel) titelInput.value = obj.titel;
          }
        } catch (e) {}
      }
      
      // Toon "Verder gaan?"-modal als er al data is voor herhalings-modus
      _toonHervatModalAlsNodig();
    });
    
    // Bij wisselen naar werkblad-modus: herlaad onder werkblad-namespace
    document.querySelectorAll("[data-modus='werkblad']").forEach(knop => {
      knop.addEventListener("click", () => {
        if (zijbalkVerplaatst) verplaatsZijbalkTerug();
        // Wacht een tick zodat body-class is geupdate
        setTimeout(() => {
          if (window.SpellingZijbalk?.herlaad) window.SpellingZijbalk.herlaad();
          if (window.SpellingWoordenkiezer?.herlaad) window.SpellingWoordenkiezer.herlaad();
          if (window._syncLijntypeUI) window._syncLijntypeUI();
        }, 0);
      });
    });
    // Of via "Terug naar startscherm" knop in herhalings-modus
    document.addEventListener("click", (e) => {
      if (e.target.matches("[onclick*='terugNaarStartscherm']") && zijbalkVerplaatst) {
        verplaatsZijbalkTerug();
        // Herlaad onder nieuwe namespace na een tick
        setTimeout(() => {
          if (window.SpellingZijbalk?.herlaad) window.SpellingZijbalk.herlaad();
          if (window.SpellingWoordenkiezer?.herlaad) window.SpellingWoordenkiezer.herlaad();
          if (window._syncLijntypeUI) window._syncLijntypeUI();
        }, 10);
      }
    });
    
    /* Toon "Verder gaan?"-modal als er al data is voor herhalings-modus.
       Roept dit aan na elke entry van herhalings-modus. */
    function _toonHervatModalAlsNodig() {
      const storage = window.SpellingModusStorage;
      if (!storage) return;
      
      const hb = window.SpellingHerhalingsbundel;
      const heeftBundelItems = (hb?.getItems()?.length || 0) > 0;
      
      let heeftWoorden = false;
      try {
        const raw = storage.getItem("spelling-weekdictee-gekozen-v1");
        const arr = JSON.parse(raw || "[]");
        heeftWoorden = Array.isArray(arr) && arr.length > 0;
      } catch (e) {}
      
      if (!heeftBundelItems && !heeftWoorden) return;
      
      // Toon modal — slechts één keer per modus-entry
      if (document.querySelector("#hb-hervat-modal")) return;
      
      const modal = document.createElement("div");
      modal.id = "hb-hervat-modal";
      modal.className = "hb-hervat-modal-overlay";
      modal.innerHTML = `
        <div class="hb-hervat-modal-inhoud">
          <div class="hb-hervat-icoon">📚</div>
          <h2>Welkom terug!</h2>
          <p>Je hebt nog een herhalingsbundel openstaan van je vorige sessie${heeftBundelItems ? ` (${hb.getItems().length} oefening${hb.getItems().length === 1 ? '' : 'en'})` : ''}.</p>
          <p>Wat wil je doen?</p>
          <div class="hb-hervat-knoppen">
            <button id="hb-hervat-verder" class="primair primair-groot" type="button">
              ✓ Verder gaan met vorige bundel
            </button>
            <button id="hb-hervat-nieuw" class="secundair" type="button">
              🔄 Nieuwe bundel starten
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      
      modal.querySelector("#hb-hervat-verder").addEventListener("click", () => modal.remove());
      modal.querySelector("#hb-hervat-nieuw").addEventListener("click", () => {
        if (!confirm("Weet je zeker dat je alle huidige keuzes wil wissen en opnieuw beginnen?")) return;
        window.SpellingModusStorage?.wisModus("herhaling");
        window.SpellingZijbalk?.reset();
        window.SpellingWoordenkiezer?.reset();
        const hbState = { titel: "Mijn herhalingsbundel", items: [], huidigePagina: 1 };
        window.SpellingModusStorage?.setItem("spelling-herhalingsbundel-v1", JSON.stringify(hbState));
        if (window.SpellingHerhalingsbundel) window.SpellingHerhalingsbundel.init();
        const titelInput = document.querySelector("#hb-boekje-titel");
        if (titelInput) titelInput.value = "Mijn herhalingsbundel";
        modal.remove();
      });
    }
    
    // Wire herhalings-acties
    document.querySelector("#hb-voeg-toe")?.addEventListener("click", () => {
      const hb = window.SpellingHerhalingsbundel;
      const zb = window.SpellingZijbalk;
      if (!hb || !zb) return;
      
      // Zoek aangevinkte OV+niveau combinaties
      const aangevinkteOefenvormen = zb.getAangevinkteOefenvormen 
        ? zb.getAangevinkteOefenvormen()
        : [];
      
      if (aangevinkteOefenvormen.length === 0) {
        alert("Vink eerst een oefenvorm + niveau aan in de zijbalk.");
        return;
      }
      
      // Voeg voor elk aangevinkte OV × niveau één item toe.
      // Bij OV's zonder niveau-keuze (bv. OV02): voeg één item toe met niveau=null.
      let aantalToegevoegd = 0;
      for (const oef of aangevinkteOefenvormen) {
        const niveaus = [...(oef.niveaus || [])];
        if (niveaus.length === 0) {
          // OV zonder niveau-keuze: één item, geen niveau
          const aantalWoorden = zb.getAantalVoorNiveau 
            ? zb.getAantalVoorNiveau(oef.id, null)
            : null;
          if (hb.voegToe(oef.id, null, aantalWoorden)) aantalToegevoegd++;
        } else {
          for (const niveau of niveaus) {
            const aantalWoorden = zb.getAantalVoorNiveau 
              ? zb.getAantalVoorNiveau(oef.id, niveau)
              : null;
            if (hb.voegToe(oef.id, niveau, aantalWoorden)) aantalToegevoegd++;
          }
        }
      }
      
      if (aantalToegevoegd === 0) {
        // voegToe heeft al een alert getoond als de pool leeg was
        return;
      }
    });
    
    document.querySelector("#hb-wis")?.addEventListener("click", () => {
      window.SpellingHerhalingsbundel?.wis();
    });
    
    document.querySelector("#hb-download")?.addEventListener("click", () => {
      window.SpellingHerhalingsbundel?.downloadPDF(false);
    });
    document.querySelector("#hb-download-oplossingen")?.addEventListener("click", () => {
      window.SpellingHerhalingsbundel?.downloadPDF(true);
    });
    
    // Bewerk-modus toggle
    document.querySelector("#hb-bewerken-toggle")?.addEventListener("click", (e) => {
      const aan = !document.body.classList.contains("hb-bewerk-aan");
      document.body.classList.toggle("hb-bewerk-aan", aan);
      e.target.classList.toggle("actief", aan);
      e.target.textContent = aan ? "✏️ Bewerken: aan" : "✏️ Bewerken: uit";
    });
    
    // Event-delegation: ✕ verwijder-knop op woorden binnen items
    document.querySelector("#hb-pages")?.addEventListener("click", (e) => {
      // ✕ knop op individueel woord
      const verwijderKnop = e.target.closest(".rij-verwijder-knop");
      if (verwijderKnop) {
        if (document.body.classList.contains("hb-bewerk-aan")) {
          e.stopPropagation();
          e.preventDefault();
          const itemEl = verwijderKnop.closest(".hb-item");
          const itemId = itemEl?.dataset.itemId;
          const woord = verwijderKnop.dataset.woord;
          if (itemId && woord && window.SpellingHerhalingsbundel?.verwijderWoordVanItem) {
            window.SpellingHerhalingsbundel.verwijderWoordVanItem(itemId, woord);
          }
        }
        return;
      }
      
      // ➕ knop "Voeg woord toe" onderaan elk item - direct random toevoegen
      const toevoegKnop = e.target.closest(".hb-knop-toevoeg-woord");
      if (toevoegKnop) {
        e.preventDefault();
        const itemId = toevoegKnop.dataset.itemId;
        if (!itemId) return;
        
        const beschikbaar = window.SpellingHerhalingsbundel?.getBeschikbareWoordenVoorItem(itemId) || [];
        if (beschikbaar.length === 0) {
          // Korte hint bij de knop ipv alert
          const oudeTekst = toevoegKnop.textContent;
          toevoegKnop.textContent = "⚠️ Geen extra woorden meer";
          toevoegKnop.disabled = true;
          setTimeout(() => {
            toevoegKnop.textContent = oudeTekst;
            toevoegKnop.disabled = false;
          }, 2000);
          return;
        }
        
        // Kies random woord uit beschikbare pool
        const idx = Math.floor(Math.random() * beschikbaar.length);
        const woord = beschikbaar[idx];
        window.SpellingHerhalingsbundel?.voegWoordToeAanItem(itemId, woord);
        return;
      }
      
      // 🔄 reset knop onderaan elk item
      const resetKnop = e.target.closest(".hb-knop-reset-woorden");
      if (resetKnop) {
        e.preventDefault();
        const itemId = resetKnop.dataset.itemId;
        if (itemId && confirm("Reset alle verwijderde woorden voor deze oefening?")) {
          window.SpellingHerhalingsbundel?.resetWoordenVanItem(itemId);
        }
        return;
      }
    });
    
    
    document.querySelector("#hb-vorig")?.addEventListener("click", () => {
      window.SpellingHerhalingsbundel?.vorigePagina();
    });
    document.querySelector("#hb-volgend")?.addEventListener("click", () => {
      window.SpellingHerhalingsbundel?.volgendePagina();
    });
    
    // Boekje-titel input
    document.querySelector("#hb-boekje-titel")?.addEventListener("input", (e) => {
      window.SpellingHerhalingsbundel?.setBoekjeTitel(e.target.value);
    });
    document.querySelector("#hb-boekje-titel")?.addEventListener("blur", () => {
      window.SpellingHerhalingsbundel?.renderPreview();
    });
    
    // Event-delegatie voor item-acties (omhoog/omlaag/verwijderen)
    document.querySelector("#hb-pages")?.addEventListener("click", (e) => {
      const hb = window.SpellingHerhalingsbundel;
      if (!hb) return;
      if (e.target.matches(".hb-knop-omhoog")) {
        hb.verplaats(e.target.dataset.itemId, "omhoog");
      } else if (e.target.matches(".hb-knop-omlaag")) {
        hb.verplaats(e.target.dataset.itemId, "omlaag");
      } else if (e.target.matches(".hb-knop-verwijder")) {
        hb.verwijder(e.target.dataset.itemId);
      }
    });
  });

})();
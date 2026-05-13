/* ==========================================================
   zijbalk.js
   
   Beheert de nieuwe zijbalk-redesign:
   - Graad-tabs bovenaan
   - Sectie 1: hoofdgroep-categorie-selector (uitklapbaar per hoofdgroep)
   - Sectie 2: woordenkiezer-knop (toont alleen aangevinkte categorieën)
   - Sectie 3: oefenvorm-multi-select met per-oefenvorm instellingen
   
   State persistentie via localStorage:
   - actieve graad
   - aangevinkte categorieën (per graad)
   - aangevinkte oefenvormen + hun instellingen
   ========================================================== */

window.SpellingZijbalk = (function() {

  /* ---------- Constanten ---------- */
  const LS_GRAAD = "spelling-zb-graad-v1";
  const LS_CATEGORIEEN = "spelling-zb-categorieen-v1";
  const LS_OEFENVORMEN = "spelling-zb-oefenvormen-v1";

  /* Definitie van oefenvormen: id, label, ondersteunde niveaus, default settings */
  const OEFENVORMEN = [
    {
      id: "ov01", label: "📷 Schrijf bij het plaatje",
      niveaus: ["basis", "kern", "verdieping", "uitbreiding"],
      defaultAantal: 9
    },
    {
      id: "ov02", label: "✏️ Woord 3× overschrijven",
      niveaus: [],
      defaultAantal: 8
    },
    {
      id: "ov03", label: "🔀 Letters door elkaar",
      niveaus: ["basis", "kern", "verdieping", "uitbreiding"],
      defaultAantal: 8
    },
    {
      id: "ov04", label: "🎨 Klanken sorteren",
      niveaus: ["basis", "kern", "verdieping", "uitbreiding"],
      defaultAantal: 12
    },
    {
      id: "ov05", label: "⭕ Klank kiezen",
      niveaus: ["basis", "kern", "verdieping", "uitbreiding"],
      defaultAantal: 8
    },
    {
      id: "ov06", label: "📝 Gebruik in zinnen",
      niveaus: ["basis", "kern", "verdieping", "uitbreiding"],
      defaultAantal: 6
    },
    {
      id: "ov07", label: "🧸 Verkleinwoorden",
      niveaus: ["basis", "kern", "verdieping", "uitbreiding"],
      defaultAantal: 8
    },
    {
      id: "weekdictee", label: "📅 Weekdictee",
      niveaus: [],
      defaultAantal: 5
    }
  ];

  const NIVEAU_LABELS = {
    basis: "⭐ Oefenen",
    kern: "⭐⭐ Toepassen",
    verdieping: "⭐⭐⭐ Verdiepen",
    uitbreiding: "⭐⭐⭐⭐ Uitbreiden"
  };

  /* ---------- State ---------- */
  let actieveGraad = 1;
  let aangevinkteCategorieen = {};
  let oefenvormState = [];

  /* ---------- Helpers ---------- */

  function _defaultStateVoor(oef) {
    return {
      id: oef.id,
      aangevinkt: false,
      niveaus: new Set(oef.niveaus.length > 0 ? ["basis"] : []),
      aantal: oef.defaultAantal,
      lijntype: "type3",
      lijnhoogte: "middel"
    };
  }

  /* BUGFIX (kritiek): zorg dat ELKE oefenvorm uit OEFENVORMEN ook een entry
     heeft in oefenvormState. Als een nieuwe oefenvorm wordt toegevoegd
     (bv. OV07) na een release, hebben bestaande gebruikers een oude
     localStorage zonder die entry → vinkjes worden niet bewaard. */
  function _vulOntbrekendeOefenvormenAan() {
    const aanwezig = new Set(oefenvormState.map(s => s.id));
    for (const oef of OEFENVORMEN) {
      if (!aanwezig.has(oef.id)) {
        oefenvormState.push(_defaultStateVoor(oef));
      }
    }
    const geldigeIds = new Set(OEFENVORMEN.map(o => o.id));
    oefenvormState = oefenvormState.filter(s => geldigeIds.has(s.id));
  }

  function laadState() {
    try {
      actieveGraad = parseInt(localStorage.getItem(LS_GRAAD) || "1", 10);
    } catch (e) { actieveGraad = 1; }
    
    try {
      const raw = localStorage.getItem(LS_CATEGORIEEN);
      if (raw) {
        const obj = JSON.parse(raw);
        for (const [graad, lijst] of Object.entries(obj)) {
          aangevinkteCategorieen[graad] = new Set(lijst);
        }
      }
    } catch (e) { /* leeg */ }
    
    try {
      const raw = localStorage.getItem(LS_OEFENVORMEN);
      if (raw) {
        const lijst = JSON.parse(raw);
        oefenvormState = lijst.map(x => ({
          ...x,
          niveaus: new Set(x.niveaus || [])
        }));
      }
    } catch (e) { /* leeg */ }
    
    if (oefenvormState.length === 0) {
      oefenvormState = OEFENVORMEN.map(_defaultStateVoor);
    }
    
    _vulOntbrekendeOefenvormenAan();
    bewaarState();
  }

  function bewaarState() {
    try {
      localStorage.setItem(LS_GRAAD, String(actieveGraad));
      
      const catObj = {};
      for (const [g, set] of Object.entries(aangevinkteCategorieen)) {
        catObj[g] = [...set];
      }
      localStorage.setItem(LS_CATEGORIEEN, JSON.stringify(catObj));
      
      const oefenLijst = oefenvormState.map(x => ({
        ...x,
        niveaus: [...x.niveaus]
      }));
      localStorage.setItem(LS_OEFENVORMEN, JSON.stringify(oefenLijst));
    } catch (e) {
      console.warn("Kon zijbalk-state niet bewaren:", e);
    }
  }

  function getAangevinkteCats() {
    if (!aangevinkteCategorieen[actieveGraad]) {
      aangevinkteCategorieen[actieveGraad] = new Set();
    }
    return aangevinkteCategorieen[actieveGraad];
  }

  /* ---------- Render: hoofdgroep-categorie-selector ----------
     BUGFIX: bewaar welke <details>-elementen openstaan vóór re-render,
     en zet ze daarna weer open. */
  function renderHoofdgroepSelector() {
    const container = document.querySelector("#hoofdgroep-selector");
    if (!container) return;
    
    const wasOpen = new Set();
    container.querySelectorAll("details.zb-hoofdgroep[open]").forEach(d => {
      if (d.dataset.hoofdgroep) wasOpen.add(d.dataset.hoofdgroep);
    });
    
    const wb = window.SpellingWoordenbibliotheek;
    if (!wb || !wb.graadHeeftWoorden(actieveGraad)) {
      container.innerHTML = `
        <p class="zb-leeg">
          Graad ${actieveGraad} is nog niet beschikbaar.
        </p>`;
      updateCategorieTeller();
      return;
    }
    
    const data = wb.categorieenPerHoofdgroep(actieveGraad);
    const aangevinkt = getAangevinkteCats();
    
    let html = "";
    for (const [hgId, groepen] of Object.entries(data)) {
      if (Object.keys(groepen).length === 0) continue;
      const hgLabel = wb.hoofdgroepLabels[hgId] || hgId;
      const hgUitleg = wb.hoofdgroepUitleg[hgId] || "";
      
      let totaal = 0, aanCount = 0;
      for (const cats of Object.values(groepen)) {
        for (const cat of cats) {
          totaal++;
          if (aangevinkt.has(cat.id)) aanCount++;
        }
      }
      
      const allesAan = aanCount === totaal && totaal > 0;
      const someAan = aanCount > 0 && aanCount < totaal;
      const isOpen = wasOpen.has(hgId);
      
      html += `
        <details class="zb-hoofdgroep" data-hoofdgroep="${hgId}" ${isOpen ? 'open' : ''}>
          <summary class="zb-hg-titel">
            <input type="checkbox" class="zb-hg-master" data-hoofdgroep="${hgId}" 
                   ${allesAan ? 'checked' : ''} 
                   ${someAan ? 'data-indeterminate="true"' : ''}>
            <span class="zb-hg-label">${hgLabel}</span>
            <span class="zb-hg-teller">${aanCount}/${totaal}</span>
          </summary>
          <div class="zb-hg-uitleg">${hgUitleg}</div>
          <div class="zb-hg-inhoud">`;
      
      for (const [groepId, cats] of Object.entries(groepen)) {
        const groepLabel = wb.groepLabels[groepId] || groepId;
        html += `<div class="zb-groep">
          <div class="zb-groep-titel">${groepLabel}</div>
          <div class="zb-cat-rij">`;
        for (const cat of cats) {
          const checked = aangevinkt.has(cat.id);
          html += `
            <label class="zb-cat-vink ${checked ? 'aan' : ''}">
              <input type="checkbox" class="zb-cat-checkbox" 
                     data-cat="${cat.id}" ${checked ? 'checked' : ''}>
              <span>${cat.naam}</span>
              <span class="zb-cat-aantal">(${cat.woorden.length})</span>
            </label>`;
        }
        html += `</div></div>`;
      }
      
      html += `</div></details>`;
    }
    
    container.innerHTML = html;
    
    container.querySelectorAll('.zb-hg-master[data-indeterminate]').forEach(el => {
      el.indeterminate = true;
    });
    
    updateCategorieTeller();
    updateWoordenkiezerKnop();
  }

  function updateCategorieTeller() {
    const aangevinkt = getAangevinkteCats();
    const teller = document.querySelector("#zb-cat-teller");
    if (teller) {
      teller.textContent = aangevinkt.size === 0 ? "" : `${aangevinkt.size} aangevinkt`;
    }
  }

  function updateWoordenkiezerKnop() {
    const knop = document.querySelector("#open-woordenkiezer");
    const info = document.querySelector("#zb-woord-info");
    const aangevinkt = getAangevinkteCats();

    // BUGFIX: zorg dat de woordenkiezer-filter wordt bijgewerkt op basis
    // van aangevinkte categorieën in zijbalk. Zo zien modules enkel
    // woorden uit categorieën die nu aan staan.
    if (window.SpellingWoordenkiezer && typeof window.SpellingWoordenkiezer.syncActieveWoorden === "function") {
      window.SpellingWoordenkiezer.syncActieveWoorden();
    }

    const aantalActief = (window._weekdictee_gekozenWoorden || []).length;
    const aantalVerborgen = (window.SpellingWoordenkiezer && typeof window.SpellingWoordenkiezer.getVerborgenAantal === "function")
      ? window.SpellingWoordenkiezer.getVerborgenAantal()
      : 0;
    
    if (knop) {
      knop.disabled = aangevinkt.size === 0;
    }
    if (info) {
      if (aangevinkt.size === 0) {
        info.textContent = "Kies eerst categorieën hierboven.";
        info.style.color = "#888";
      } else if (aantalActief === 0 && aantalVerborgen === 0) {
        info.textContent = "Klik op de knop om woorden te kiezen.";
        info.style.color = "#555";
      } else {
        let html = `<strong>${aantalActief}</strong> woord${aantalActief === 1 ? '' : 'en'} actief ✓`;
        if (aantalVerborgen > 0) {
          html += ` <span class="zb-verborgen-hint">+${aantalVerborgen} verborgen</span>`;
        }
        info.innerHTML = html;
        info.style.color = "var(--zisa-blauw, #2196F3)";
      }
    }
    const wtTeller = document.querySelector("#zb-woord-teller");
    if (wtTeller) {
      if (aantalActief === 0 && aantalVerborgen === 0) {
        wtTeller.textContent = "";
      } else if (aantalVerborgen > 0) {
        wtTeller.textContent = `${aantalActief} actief (+${aantalVerborgen})`;
      } else {
        wtTeller.textContent = `${aantalActief} woorden`;
      }
    }
  }

  /* ---------- Render: oefenvorm-selector ---------- */
  function renderOefenvormen() {
    const container = document.querySelector("#oefenvorm-selector");
    if (!container) return;
    
    let html = "";
    for (const oef of OEFENVORMEN) {
      let state = oefenvormState.find(s => s.id === oef.id);
      if (!state) {
        state = _defaultStateVoor(oef);
        oefenvormState.push(state);
      }
      
      const aan = state.aangevinkt || false;
      
      html += `
        <details class="zb-oefenvorm ${aan ? 'aan' : ''}" data-oef="${oef.id}" ${aan ? 'open' : ''}>
          <summary class="zb-oef-titel">
            <input type="checkbox" class="zb-oef-checkbox" data-oef="${oef.id}" ${aan ? 'checked' : ''}>
            <span class="zb-oef-label">${oef.label}</span>
          </summary>
          <div class="zb-oef-instel">`;
      
      if (oef.niveaus.length > 0) {
        html += `<div class="zb-oef-rij"><label>Niveau(s):</label><div class="zb-oef-niveaus">`;
        for (const niv of oef.niveaus) {
          const ningevinkt = state.niveaus && state.niveaus.has(niv);
          html += `
            <label class="zb-niveau-vink ${ningevinkt ? 'aan' : ''}">
              <input type="checkbox" class="zb-niveau-cb" 
                     data-oef="${oef.id}" data-niveau="${niv}" ${ningevinkt ? 'checked' : ''}>
              <span>${NIVEAU_LABELS[niv]}</span>
            </label>`;
        }
        html += `</div></div>`;
      }
      
      if (oef.id !== "weekdictee") {
        html += `
          <div class="zb-oef-rij">
            <label>Aantal woorden:</label>
            <input type="number" class="zb-oef-aantal" data-oef="${oef.id}" 
                   min="3" max="20" value="${state.aantal || oef.defaultAantal}">
          </div>`;
      }
      
      html += `
        <div class="zb-oef-rij">
          <label>Schrijflijn-hoogte:</label>
          <div class="zb-hoogte-knoppen" data-oef="${oef.id}">
            <button class="zb-hoogte-btn ${state.lijnhoogte === 'klein' ? 'actief' : ''}" 
                    data-hoogte="klein" type="button">Klein</button>
            <button class="zb-hoogte-btn ${(state.lijnhoogte || 'middel') === 'middel' ? 'actief' : ''}" 
                    data-hoogte="middel" type="button">Middel</button>
          </div>
        </div>`;
      
      html += `</div></details>`;
    }
    
    container.innerHTML = html;
    updateOefenvormTeller();
  }

  function updateOefenvormTeller() {
    const teller = document.querySelector("#zb-oef-teller");
    const aantalAan = oefenvormState.filter(s => s.aangevinkt).length;
    if (teller) {
      teller.textContent = aantalAan === 0 ? "" : `${aantalAan} actief`;
    }
  }

  /* Helper: vind state, maak hem aan als ontbrekend (safety net) */
  function _getOrCreateState(oefId) {
    let state = oefenvormState.find(s => s.id === oefId);
    if (!state) {
      const oef = OEFENVORMEN.find(o => o.id === oefId);
      if (oef) {
        state = _defaultStateVoor(oef);
        oefenvormState.push(state);
      }
    }
    return state;
  }

  /* ---------- Event handlers ---------- */
  function bedraadEvents() {
    document.querySelectorAll(".graad-tab").forEach(tab => {
      tab.addEventListener("click", () => {
        if (tab.disabled) return;
        document.querySelectorAll(".graad-tab").forEach(t => t.classList.remove("actief"));
        tab.classList.add("actief");
        actieveGraad = parseInt(tab.dataset.graad, 10);
        const legacy = document.querySelector(".graad-knop[data-graad='" + actieveGraad + "']");
        if (legacy) {
          document.querySelectorAll(".graad-knop").forEach(b => b.classList.remove("actief"));
          legacy.classList.add("actief");
        }
        bewaarState();
        renderHoofdgroepSelector();
      });
    });
    
    document.querySelector("#hoofdgroep-selector")?.addEventListener("change", (e) => {
      if (e.target.matches(".zb-cat-checkbox")) {
        const catId = e.target.dataset.cat;
        const set = getAangevinkteCats();
        if (e.target.checked) set.add(catId);
        else set.delete(catId);
        bewaarState();
        renderHoofdgroepSelector();
      }
      else if (e.target.matches(".zb-hg-master")) {
        const hgId = e.target.dataset.hoofdgroep;
        const wb = window.SpellingWoordenbibliotheek;
        const data = wb.categorieenPerHoofdgroep(actieveGraad);
        const set = getAangevinkteCats();
        const groepen = data[hgId] || {};
        for (const cats of Object.values(groepen)) {
          for (const cat of cats) {
            if (e.target.checked) set.add(cat.id);
            else set.delete(cat.id);
          }
        }
        bewaarState();
        renderHoofdgroepSelector();
      }
    });
    
    document.querySelector("#open-woordenkiezer")?.addEventListener("click", () => {
      if (window.SpellingWoordenkiezer) {
        window._zb_aangevinkteCategorieen = getAangevinkteCats();
        window.SpellingWoordenkiezer.open();
      }
    });
    
    document.querySelector("#oefenvorm-selector")?.addEventListener("change", (e) => {
      if (e.target.matches(".zb-oef-checkbox")) {
        const oefId = e.target.dataset.oef;
        const state = _getOrCreateState(oefId);
        if (state) {
          state.aangevinkt = e.target.checked;
          bewaarState();
          renderOefenvormen();
          syncLegacyCatKnop();
        }
      }
      else if (e.target.matches(".zb-niveau-cb")) {
        const oefId = e.target.dataset.oef;
        const niv = e.target.dataset.niveau;
        const state = _getOrCreateState(oefId);
        if (state) {
          if (e.target.checked) state.niveaus.add(niv);
          else state.niveaus.delete(niv);
          bewaarState();
        }
      }
      else if (e.target.matches(".zb-oef-aantal")) {
        const oefId = e.target.dataset.oef;
        const state = _getOrCreateState(oefId);
        if (state) {
          state.aantal = parseInt(e.target.value, 10) || state.aantal;
          bewaarState();
        }
      }
    });
    
    document.querySelector("#oefenvorm-selector")?.addEventListener("click", (e) => {
      if (e.target.matches(".zb-hoogte-btn")) {
        const oefId = e.target.closest(".zb-hoogte-knoppen").dataset.oef;
        const hoogte = e.target.dataset.hoogte;
        const state = _getOrCreateState(oefId);
        if (state) {
          state.lijnhoogte = hoogte;
          bewaarState();
          e.target.parentElement.querySelectorAll(".zb-hoogte-btn").forEach(b => b.classList.remove("actief"));
          e.target.classList.add("actief");
        }
      }
    });
  }

  /* Sync legacy .cat-knop.actief zodat bestaande code niet breekt. */
  function syncLegacyCatKnop() {
    const eersteAan = oefenvormState.find(s => s.aangevinkt);
    const legacy = document.querySelector("#legacy-knoppen");
    if (!legacy) return;
    const oudeKnop = legacy.querySelector(".cat-knop");
    if (oudeKnop && eersteAan) {
      oudeKnop.dataset.categorie = eersteAan.id;
    }
  }

  /* ---------- Public API ---------- */
  function getActieveGraad() {
    return actieveGraad;
  }
  
  function getAangevinkteOefenvormen() {
    return oefenvormState.filter(s => s.aangevinkt).map(s => ({
      ...s,
      niveaus: [...s.niveaus]
    }));
  }
  
  function getAangevinkteCategorieIds() {
    return [...getAangevinkteCats()];
  }

  function init() {
    laadState();
    
    document.querySelectorAll(".graad-tab").forEach(t => t.classList.remove("actief"));
    const tab = document.querySelector(`.graad-tab[data-graad="${actieveGraad}"]`);
    if (tab && !tab.disabled) tab.classList.add("actief");
    else {
      actieveGraad = 1;
      document.querySelector('.graad-tab[data-graad="1"]')?.classList.add("actief");
    }
    
    renderHoofdgroepSelector();
    renderOefenvormen();
    bedraadEvents();
    syncLegacyCatKnop();
    
    window.addEventListener("spelling:woorden-gewijzigd", () => {
      updateWoordenkiezerKnop();
    });
  }

  return {
    init,
    getActieveGraad,
    getAangevinkteOefenvormen,
    getAangevinkteCategorieIds,
    updateWoordenkiezerKnop
  };

})();

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => window.SpellingZijbalk.init());
} else {
  window.SpellingZijbalk.init();
}
